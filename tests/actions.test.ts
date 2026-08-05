import { beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeCosmos } from "./fake-cosmos";

// Mock auth + email + next/cache so we can call server actions directly.
let currentUser: { id: string; name: string; email: string; isAdmin: boolean } | null = null;
function setCurrentUser(u: typeof currentUser) {
  currentUser = u;
}

beforeEach(() => {
  vi.resetModules();
  installFakeCosmos();
  currentUser = null;

  vi.doMock("@/auth", () => ({
    auth: async () => (currentUser ? { user: currentUser } : null),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }));
  vi.doMock("next/cache", () => ({
    revalidatePath: vi.fn(),
  }));
  vi.doMock("@/lib/email", () => ({
    sendEmail: vi.fn(),
    sendBulkEmail: vi.fn(),
    newGameEmail: () => ({ subject: "", html: "" }),
    teamRequestEmail: () => ({ subject: "", html: "" }),
  }));
});

async function seed() {
  const repo = await import("@/lib/repo");
  const admin = await repo.createUser({
    email: "admin@x.com",
    name: "Admin",
    provider: "credentials",
  });
  const alice = await repo.createUser({
    email: "alice@x.com",
    name: "Alice",
    provider: "credentials",
  });
  const bob = await repo.createUser({
    email: "bob@x.com",
    name: "Bob",
    provider: "credentials",
  });
  const game = await repo.createGame({
    title: "Cornhole",
    description: "Toss bags.",
    minTeamSize: 2,
    maxTeamSize: 2,
    createdBy: admin.id,
  });
  const soloGame = await repo.createGame({
    title: "Solo darts",
    description: "Solo only",
    minTeamSize: 1,
    maxTeamSize: 1,
    createdBy: admin.id,
  });
  return { repo, admin, alice, bob, game, soloGame };
}

describe("toggleSignupAction", () => {
  it("signs up then removes the signup", async () => {
    const { repo, alice, game } = await seed();
    setCurrentUser({ ...alice });
    const { toggleSignupAction } = await import("@/app/actions/games");

    await toggleSignupAction(game.id);
    expect(await repo.getSignup(game.id, alice.id)).toBeTruthy();

    await toggleSignupAction(game.id);
    expect(await repo.getSignup(game.id, alice.id)).toBeNull();
  });

  it("requires a signed-in user", async () => {
    const { game } = await seed();
    const { toggleSignupAction } = await import("@/app/actions/games");
    await expect(toggleSignupAction(game.id)).rejects.toThrow(/Unauthorized/);
  });
});

describe("bulkSignupAction", () => {
  it("signs up for many games, skipping any already signed up", async () => {
    const { repo, alice, game, soloGame } = await seed();
    setCurrentUser({ ...alice });
    await repo.createSignup(game.id, alice.id); // already in
    const { bulkSignupAction } = await import("@/app/actions/games");

    await bulkSignupAction([game.id, soloGame.id]);

    expect((await repo.listSignupsForGame(game.id)).length).toBe(1);
    expect((await repo.listSignupsForGame(soloGame.id)).length).toBe(1);
  });
});

describe("team requests", () => {
  it("end-to-end: send → accept assigns both to same team", async () => {
    const { repo, alice, bob, game } = await seed();
    setCurrentUser({ ...alice });
    const actions = await import("@/app/actions/games");

    await actions.sendTeamRequestAction(game.id, bob.id);

    // Alice was auto-signed-up
    expect(await repo.getSignup(game.id, alice.id)).toBeTruthy();

    const [req] = await repo.listIncomingTeamRequests(bob.id);
    expect(req).toBeTruthy();
    expect(req.fromUserId).toBe(alice.id);

    setCurrentUser({ ...bob });
    await actions.respondToTeamRequestAction(req.id, true);

    const aliceSignup = await repo.getSignup(game.id, alice.id);
    const bobSignup = await repo.getSignup(game.id, bob.id);
    expect(aliceSignup?.teamId).toBeTruthy();
    expect(aliceSignup?.teamId).toBe(bobSignup?.teamId);
  });

  it("rejects requests to a solo-only game", async () => {
    const { alice, bob, soloGame } = await seed();
    setCurrentUser({ ...alice });
    const { sendTeamRequestAction } = await import("@/app/actions/games");
    await expect(
      sendTeamRequestAction(soloGame.id, bob.id),
    ).rejects.toThrow(/solo only/);
  });

  it("can't team up with yourself", async () => {
    const { alice, game } = await seed();
    setCurrentUser({ ...alice });
    const { sendTeamRequestAction } = await import("@/app/actions/games");
    await expect(
      sendTeamRequestAction(game.id, alice.id),
    ).rejects.toThrow(/yourself/);
  });

  it("decline marks the request and does not assign teams", async () => {
    const { repo, alice, bob, game } = await seed();
    setCurrentUser({ ...alice });
    const actions = await import("@/app/actions/games");
    await actions.sendTeamRequestAction(game.id, bob.id);
    const [req] = await repo.listIncomingTeamRequests(bob.id);

    setCurrentUser({ ...bob });
    await actions.respondToTeamRequestAction(req.id, false);

    const updated = await repo.getTeamRequest(req.id, bob.id);
    expect(updated?.status).toBe("declined");
    const bobSignup = await repo.getSignup(game.id, bob.id);
    expect(bobSignup).toBeNull();
  });
});

describe("createGameAction", () => {
  it("rejects non-admins", async () => {
    const { alice } = await seed();
    setCurrentUser({ ...alice, isAdmin: false });
    const { createGameAction } = await import("@/app/actions/games");
    const fd = new FormData();
    fd.set("title", "X");
    fd.set("description", "y");
    fd.set("minTeamSize", "1");
    fd.set("maxTeamSize", "1");
    await expect(createGameAction(undefined, fd)).rejects.toThrow(/admin/);
  });

  it("admin can create a scheduled itinerary activity", async () => {
    const { admin, repo } = await seed();
    setCurrentUser({ ...admin });
    const email = await import("@/lib/email");
    const { createGameAction } = await import("@/app/actions/games");
    const fd = new FormData();
    fd.set("title", "Wii Bowling");
    fd.set("description", "Strike");
    fd.set("location", "Airbnb");
    fd.set("scheduledFor", "2026-08-08T14:30");
    fd.set("minTeamSize", "1");
    fd.set("maxTeamSize", "4");
    const result = await createGameAction(undefined, fd);
    expect(result).toBeUndefined();
    const games = await repo.listGames();
    expect(games.find((g) => g.title === "Wii Bowling")).toMatchObject({
      location: "Airbnb",
      scheduledFor: "2026-08-08T14:30",
    });
    expect(email.sendBulkEmail).not.toHaveBeenCalled();
  });

  it("rejects max < min team size", async () => {
    const { admin } = await seed();
    setCurrentUser({ ...admin });
    const { createGameAction } = await import("@/app/actions/games");
    const fd = new FormData();
    fd.set("title", "X");
    fd.set("description", "y");
    fd.set("minTeamSize", "4");
    fd.set("maxTeamSize", "2");
    const result = await createGameAction(undefined, fd);
    expect(result?.error).toMatch(/maxTeamSize/);
  });
});

describe("reorderGamesAction", () => {
  it("allows an admin to persist activity order", async () => {
    const { admin, game, soloGame, repo } = await seed();
    setCurrentUser({ ...admin });
    const { reorderGamesAction } = await import("@/app/actions/games");

    await reorderGamesAction([soloGame.id, game.id]);

    expect((await repo.listGames()).map((activity) => activity.id)).toEqual([
      soloGame.id,
      game.id,
    ]);
  });

  it("rejects non-admin reordering", async () => {
    const { alice, game } = await seed();
    setCurrentUser({ ...alice });
    const { reorderGamesAction } = await import("@/app/actions/games");

    await expect(reorderGamesAction([game.id])).rejects.toThrow(/admin/);
  });
});

describe("setUserAdminAction", () => {
  it("admin can promote another user", async () => {
    const { admin, alice, repo } = await seed();
    setCurrentUser({ ...admin });
    const { setUserAdminAction } = await import("@/app/actions/games");
    await setUserAdminAction(alice.id, true);
    const updated = await repo.getUserById(alice.id);
    expect(updated?.isAdmin).toBe(true);
  });

  it("non-admin cannot promote", async () => {
    const { alice, bob } = await seed();
    setCurrentUser({ ...alice, isAdmin: false });
    const { setUserAdminAction } = await import("@/app/actions/games");
    await expect(setUserAdminAction(bob.id, true)).rejects.toThrow(/admin/);
  });
});
