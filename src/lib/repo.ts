import "server-only";
import { getContainer } from "./db";
import type {
  Game,
  GameSuggestion,
  GameSuggestionStatus,
  Signup,
  TeamRequest,
  TeamRequestStatus,
  User,
} from "./models";
import { randomUUID } from "crypto";

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUserById(id: string): Promise<User | null> {
  const c = await getContainer("users");
  try {
    const { resource } = await c.item(id, id).read<User>();
    return resource ?? null;
  } catch (e) {
    if ((e as { code?: number }).code === 404) return null;
    throw e;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const c = await getContainer("users");
  const { resources } = await c.items
    .query<User>({
      query: "SELECT * FROM c WHERE LOWER(c.email) = @e",
      parameters: [{ name: "@e", value: email.toLowerCase() }],
    })
    .fetchAll();
  return resources[0] ?? null;
}

export async function listUsers(): Promise<User[]> {
  const c = await getContainer("users");
  const { resources } = await c.items
    .query<User>("SELECT * FROM c ORDER BY c.name")
    .fetchAll();
  return resources;
}

export async function countUsers(): Promise<number> {
  const c = await getContainer("users");
  const { resources } = await c.items
    .query<number>("SELECT VALUE COUNT(1) FROM c")
    .fetchAll();
  return resources[0] ?? 0;
}

export async function createUser(
  input: Omit<User, "id" | "createdAt" | "isAdmin"> & {
    id?: string;
    isAdmin?: boolean;
  },
): Promise<User> {
  const c = await getContainer("users");
  // First user becomes admin.
  const isAdmin = input.isAdmin ?? (await countUsers()) === 0;
  const user: User = {
    id: input.id ?? randomUUID(),
    email: input.email.toLowerCase(),
    name: input.name,
    image: input.image,
    provider: input.provider,
    passwordHash: input.passwordHash,
    isAdmin,
    createdAt: new Date().toISOString(),
  };
  await c.items.create(user);
  return user;
}

export async function updateUser(user: User): Promise<User> {
  const c = await getContainer("users");
  const { resource } = await c.item(user.id, user.id).replace(user);
  return resource as User;
}

// ─── Games ───────────────────────────────────────────────────────────────────

export async function listGames(): Promise<Game[]> {
  const c = await getContainer("games");
  const { resources } = await c.items
    .query<Game>("SELECT * FROM c")
    .fetchAll();
  // Cosmos SQL ORDER BY does not support expressions, so sort in memory.
  return [...resources].sort((a, b) => {
    const ka = a.scheduledFor ?? a.createdAt;
    const kb = b.scheduledFor ?? b.createdAt;
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}

export async function getGame(id: string): Promise<Game | null> {
  const c = await getContainer("games");
  try {
    const { resource } = await c.item(id, id).read<Game>();
    return resource ?? null;
  } catch (e) {
    if ((e as { code?: number }).code === 404) return null;
    throw e;
  }
}

export async function createGame(
  input: Omit<Game, "id" | "createdAt">,
): Promise<Game> {
  const c = await getContainer("games");
  const game: Game = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  await c.items.create(game);
  return game;
}

export async function updateGame(
  id: string,
  patch: Partial<Omit<Game, "id" | "createdAt" | "createdBy">>,
): Promise<Game | null> {
  const c = await getContainer("games");
  const existing = await getGame(id);
  if (!existing) return null;
  const updated: Game = { ...existing, ...patch };
  // Strip undefined optional fields so they're removed from the doc.
  if (patch.location === undefined && "location" in patch) delete updated.location;
  if (patch.scheduledFor === undefined && "scheduledFor" in patch) delete updated.scheduledFor;
  if (patch.imageUrl === undefined && "imageUrl" in patch) delete updated.imageUrl;
  await c.item(id, id).replace(updated);
  return updated;
}

export async function updateGameImage(
  id: string,
  imageUrl: string | undefined,
): Promise<Game | null> {
  const c = await getContainer("games");
  const existing = await getGame(id);
  if (!existing) return null;
  const updated: Game = { ...existing, imageUrl: imageUrl || undefined };
  await c.item(id, id).replace(updated);
  return updated;
}

export async function deleteGame(id: string): Promise<void> {
  const games = await getContainer("games");
  const signups = await getContainer("signups");
  // Remove signups for this game first (partitioned by gameId, cheap).
  const { resources: gameSignups } = await signups.items
    .query<Signup>({
      query: "SELECT * FROM c WHERE c.gameId = @g",
      parameters: [{ name: "@g", value: id }],
    })
    .fetchAll();
  await Promise.all(
    gameSignups.map((s) => signups.item(s.id, s.gameId).delete()),
  );
  await games.item(id, id).delete();
}

// ─── Signups ─────────────────────────────────────────────────────────────────

export async function listSignupsForGame(gameId: string): Promise<Signup[]> {
  const c = await getContainer("signups");
  const { resources } = await c.items
    .query<Signup>({
      query: "SELECT * FROM c WHERE c.gameId = @g",
      parameters: [{ name: "@g", value: gameId }],
    })
    .fetchAll();
  return resources;
}

export async function listSignupsForUser(userId: string): Promise<Signup[]> {
  const c = await getContainer("signups");
  const { resources } = await c.items
    .query<Signup>({
      query: "SELECT * FROM c WHERE c.userId = @u",
      parameters: [{ name: "@u", value: userId }],
    })
    .fetchAll();
  return resources;
}

export async function getSignup(
  gameId: string,
  userId: string,
): Promise<Signup | null> {
  const c = await getContainer("signups");
  const { resources } = await c.items
    .query<Signup>({
      query: "SELECT * FROM c WHERE c.gameId = @g AND c.userId = @u",
      parameters: [
        { name: "@g", value: gameId },
        { name: "@u", value: userId },
      ],
    })
    .fetchAll();
  return resources[0] ?? null;
}

export async function createSignup(
  gameId: string,
  userId: string,
  teamId?: string,
): Promise<Signup> {
  const c = await getContainer("signups");
  const signup: Signup = {
    id: randomUUID(),
    gameId,
    userId,
    teamId,
    createdAt: new Date().toISOString(),
  };
  await c.items.create(signup);
  return signup;
}

export async function deleteSignup(
  gameId: string,
  signupId: string,
): Promise<void> {
  const c = await getContainer("signups");
  await c.item(signupId, gameId).delete();
}

export async function setSignupTeam(
  signup: Signup,
  teamId: string,
): Promise<Signup> {
  const c = await getContainer("signups");
  const updated: Signup = { ...signup, teamId };
  const { resource } = await c.item(signup.id, signup.gameId).replace(updated);
  return resource as Signup;
}

// ─── Team requests ───────────────────────────────────────────────────────────

export async function listIncomingTeamRequests(
  userId: string,
): Promise<TeamRequest[]> {
  const c = await getContainer("teamRequests");
  const { resources } = await c.items
    .query<TeamRequest>({
      query:
        "SELECT * FROM c WHERE c.toUserId = @u AND c.status = 'pending' ORDER BY c.createdAt DESC",
      parameters: [{ name: "@u", value: userId }],
    })
    .fetchAll();
  return resources;
}

export async function listOutgoingTeamRequests(
  userId: string,
): Promise<TeamRequest[]> {
  const c = await getContainer("teamRequests");
  const { resources } = await c.items
    .query<TeamRequest>({
      query: "SELECT * FROM c WHERE c.fromUserId = @u ORDER BY c.createdAt DESC",
      parameters: [{ name: "@u", value: userId }],
    })
    .fetchAll();
  return resources;
}

export async function listTeamRequestsForGame(
  gameId: string,
): Promise<TeamRequest[]> {
  const c = await getContainer("teamRequests");
  const { resources } = await c.items
    .query<TeamRequest>({
      query: "SELECT * FROM c WHERE c.gameId = @g",
      parameters: [{ name: "@g", value: gameId }],
    })
    .fetchAll();
  return resources;
}

export async function getTeamRequest(
  id: string,
  toUserId: string,
): Promise<TeamRequest | null> {
  const c = await getContainer("teamRequests");
  try {
    const { resource } = await c.item(id, toUserId).read<TeamRequest>();
    return resource ?? null;
  } catch (e) {
    if ((e as { code?: number }).code === 404) return null;
    throw e;
  }
}

export async function createTeamRequest(
  gameId: string,
  fromUserId: string,
  toUserId: string,
): Promise<TeamRequest> {
  const c = await getContainer("teamRequests");
  const req: TeamRequest = {
    id: randomUUID(),
    gameId,
    fromUserId,
    toUserId,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await c.items.create(req);
  return req;
}

export async function updateTeamRequestStatus(
  req: TeamRequest,
  status: TeamRequestStatus,
): Promise<TeamRequest> {
  const c = await getContainer("teamRequests");
  const updated: TeamRequest = {
    ...req,
    status,
    respondedAt: new Date().toISOString(),
  };
  const { resource } = await c.item(req.id, req.toUserId).replace(updated);
  return resource as TeamRequest;
}

// ─── Game suggestions ────────────────────────────────────────────────────────

export async function createGameSuggestion(
  input: Omit<GameSuggestion, "id" | "createdAt" | "status">,
): Promise<GameSuggestion> {
  const c = await getContainer("gameSuggestions");
  const s: GameSuggestion = {
    ...input,
    id: randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await c.items.create(s);
  return s;
}

export async function listGameSuggestions(
  status?: GameSuggestionStatus,
): Promise<GameSuggestion[]> {
  const c = await getContainer("gameSuggestions");
  const { resources } = await c.items
    .query<GameSuggestion>(
      status
        ? {
            query: "SELECT * FROM c WHERE c.status = @s",
            parameters: [{ name: "@s", value: status }],
          }
        : "SELECT * FROM c",
    )
    .fetchAll();
  return [...resources].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
  );
}

export async function getGameSuggestion(
  id: string,
): Promise<GameSuggestion | null> {
  const c = await getContainer("gameSuggestions");
  try {
    const { resource } = await c.item(id, id).read<GameSuggestion>();
    return resource ?? null;
  } catch (e) {
    if ((e as { code?: number }).code === 404) return null;
    throw e;
  }
}

export async function updateGameSuggestion(
  s: GameSuggestion,
): Promise<GameSuggestion> {
  const c = await getContainer("gameSuggestions");
  const { resource } = await c.item(s.id, s.id).replace(s);
  return resource as GameSuggestion;
}

export async function deleteGameSuggestion(id: string): Promise<void> {
  const c = await getContainer("gameSuggestions");
  await c.item(id, id).delete();
}
