"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import {
  createGame,
  createGameSuggestion,
  createSignup,
  createTeamRequest,
  deleteGame,
  deleteGameSuggestion,
  deleteSignup,
  deleteUser,
  getGame,
  getGameSuggestion,
  getSignup,
  getTeamRequest,
  getUserById,
  listSignupsForGame,
  listUsers,
  setSignupTeam,
  updateGame,
  updateGameImage,
  updateGameSuggestion,
  updateTeamRequestStatus,
  updateUser,
} from "@/lib/repo";
import {
  gameSuggestionEmail,
  newGameEmail,
  sendEmail,
  sendBulkEmail,
  teamRequestEmail,
} from "@/lib/email";
import { env } from "@/lib/env";
import { randomUUID } from "crypto";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

async function requireAdminSession() {
  const user = await requireSession();
  if (!user.isAdmin) throw new Error("Forbidden: admin only");
  return user;
}

// ─── Games (admin) ───────────────────────────────────────────────────────────

const MAX_IMAGE_LEN = 1_500_000; // ~1.5 MB; Cosmos doc limit is 2 MB.

const imageUrlSchema = z
  .string()
  .max(MAX_IMAGE_LEN, "Image too large (please use a smaller photo)")
  .refine(
    (s) => s.startsWith("data:image/") || /^https?:\/\//i.test(s),
    "Must be an uploaded image or http(s) URL",
  )
  .optional();

const gameSchema = z
  .object({
    title: z.string().min(2).max(120).trim(),
    description: z.string().min(1).max(2000).trim(),
    location: z.string().max(200).trim().optional(),
    scheduledFor: z.string().trim().optional(),
    minTeamSize: z.coerce.number().int().min(1).max(50),
    maxTeamSize: z.coerce.number().int().min(1).max(50),
    imageUrl: imageUrlSchema,
  })
  .refine((v) => v.maxTeamSize >= v.minTeamSize, {
    message: "maxTeamSize must be >= minTeamSize",
    path: ["maxTeamSize"],
  });

export type GameFormState = { error?: string } | undefined;

export async function createGameAction(
  _prev: GameFormState,
  formData: FormData,
): Promise<GameFormState> {
  const admin = await requireAdminSession();
  const parsed = gameSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location") || undefined,
    scheduledFor: formData.get("scheduledFor") || undefined,
    minTeamSize: formData.get("minTeamSize"),
    maxTeamSize: formData.get("maxTeamSize"),
    imageUrl: formData.get("imageUrl") || undefined,
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  const game = await createGame({
    ...parsed.data,
    createdBy: admin.id,
  });

  // Notify all users about the new game.
  const users = await listUsers();
  const recipients = users.map((u) => u.email).filter(Boolean);
  if (recipients.length) {
    const { subject, html } = newGameEmail({
      gameTitle: game.title,
      gameDescription: game.description,
      gameUrl: `${env.appUrl}/games/${game.id}`,
    });
    await sendBulkEmail({ to: recipients, subject, html });
  }

  revalidatePath("/games");
  revalidatePath("/admin/games");
  return undefined;
}

export type UpdateGameFormState =
  | { error?: string; ok?: boolean }
  | undefined;

export async function updateGameAction(
  _prev: UpdateGameFormState,
  formData: FormData,
): Promise<UpdateGameFormState> {
  await requireAdminSession();
  const gameId = String(formData.get("gameId") ?? "");
  if (!gameId) return { error: "Missing gameId" };
  const existing = await getGame(gameId);
  if (!existing) return { error: "Game not found" };

  const parsed = gameSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location") || undefined,
    scheduledFor: formData.get("scheduledFor") || undefined,
    minTeamSize: formData.get("minTeamSize"),
    maxTeamSize: formData.get("maxTeamSize"),
    imageUrl: formData.get("imageUrl") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  await updateGame(gameId, {
    title: parsed.data.title,
    description: parsed.data.description,
    location: parsed.data.location,
    scheduledFor: parsed.data.scheduledFor,
    minTeamSize: parsed.data.minTeamSize,
    maxTeamSize: parsed.data.maxTeamSize,
    imageUrl: parsed.data.imageUrl,
  });
  revalidatePath("/games");
  revalidatePath(`/games/${gameId}`);
  revalidatePath("/admin/games");
  return { ok: true };
}

export async function deleteGameAction(gameId: string) {
  await requireAdminSession();
  await deleteGame(gameId);
  revalidatePath("/games");
  revalidatePath("/admin/games");
}

export type ImageFormState = { error?: string; ok?: boolean } | undefined;

export async function setGameImageAction(
  _prev: ImageFormState,
  formData: FormData,
): Promise<ImageFormState> {
  await requireAdminSession();
  const gameId = String(formData.get("gameId") ?? "");
  if (!gameId) return { error: "Missing gameId" };
  const raw = formData.get("imageUrl");
  const value = raw ? String(raw) : undefined;
  const parsed = imageUrlSchema.safeParse(value);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  await updateGameImage(gameId, parsed.data);
  revalidatePath("/games");
  revalidatePath(`/games/${gameId}`);
  revalidatePath("/admin/games");
  return { ok: true };
}

// ─── Signups (everyone) ──────────────────────────────────────────────────────

export async function toggleSignupAction(gameId: string) {
  const user = await requireSession();
  const existing = await getSignup(gameId, user.id);
  if (existing) {
    await deleteSignup(gameId, existing.id);
  } else {
    await createSignup(gameId, user.id);
  }
  revalidatePath(`/games/${gameId}`);
  revalidatePath("/games");
}

export async function bulkSignupAction(gameIds: string[]) {
  const user = await requireSession();
  await Promise.all(
    gameIds.map(async (gameId) => {
      const existing = await getSignup(gameId, user.id);
      if (!existing) await createSignup(gameId, user.id);
    }),
  );
  revalidatePath("/games");
  for (const id of gameIds) revalidatePath(`/games/${id}`);
}

// ─── Team requests ───────────────────────────────────────────────────────────

export async function sendTeamRequestAction(gameId: string, toUserId: string) {
  const user = await requireSession();
  if (toUserId === user.id) throw new Error("Can't team up with yourself");

  const game = await getGame(gameId);
  if (!game) throw new Error("Game not found");
  if (game.maxTeamSize < 2) throw new Error("This game is solo only");

  const target = await getUserById(toUserId);
  if (!target) throw new Error("User not found");

  // Make sure both are signed up (sender at least). Auto-signup the sender.
  const mySignup = await getSignup(gameId, user.id);
  if (!mySignup) await createSignup(gameId, user.id);

  await createTeamRequest(gameId, user.id, toUserId);

  const { subject, html } = teamRequestEmail({
    fromName: user.name ?? user.email ?? "A teammate",
    gameTitle: game.title,
    gameUrl: `${env.appUrl}/games/${gameId}`,
  });
  await sendEmail({ to: target.email, subject, html });

  revalidatePath(`/games/${gameId}`);
}

export async function respondToTeamRequestAction(
  requestId: string,
  accept: boolean,
) {
  const user = await requireSession();
  const req = await getTeamRequest(requestId, user.id);
  if (!req) throw new Error("Request not found");
  if (req.toUserId !== user.id) throw new Error("Not your request");
  if (req.status !== "pending") return;

  if (!accept) {
    await updateTeamRequestStatus(req, "declined");
    revalidatePath(`/games/${req.gameId}`);
    return;
  }

  // Accept: ensure both have signups, then assign them a shared teamId.
  const game = await getGame(req.gameId);
  if (!game) throw new Error("Game no longer exists");

  const [fromSignup, toSignupExisting] = await Promise.all([
    getSignup(req.gameId, req.fromUserId),
    getSignup(req.gameId, req.toUserId),
  ]);
  const sender = fromSignup ?? (await createSignup(req.gameId, req.fromUserId));
  const receiver = toSignupExisting ?? (await createSignup(req.gameId, req.toUserId));

  // Use sender's existing team if present, else mint a new one.
  const teamId = sender.teamId ?? randomUUID();
  await Promise.all([
    sender.teamId === teamId ? Promise.resolve(sender) : setSignupTeam(sender, teamId),
    setSignupTeam(receiver, teamId),
  ]);

  await updateTeamRequestStatus(req, "accepted");
  revalidatePath(`/games/${req.gameId}`);
}

// ─── Admin: user management ──────────────────────────────────────────────────

export async function setUserAdminAction(userId: string, isAdmin: boolean) {
  await requireAdminSession();
  const u = await getUserById(userId);
  if (!u) throw new Error("User not found");
  await updateUser({ ...u, isAdmin });
  revalidatePath("/admin/users");
}

export async function deleteUserAction(userId: string) {
  const admin = await requireAdminSession();
  if (userId === admin.id) throw new Error("You can't delete yourself");
  const u = await getUserById(userId);
  if (!u) throw new Error("User not found");
  await deleteUser(userId);
  revalidatePath("/admin/users");
  revalidatePath("/games");
}

// Re-export for tests.
export { listSignupsForGame };

// ─── Game suggestions ────────────────────────────────────────────────────────

const SUGGESTION_NOTIFY_EMAIL = "bp32795@gmail.com";

const suggestionSchema = z
  .object({
    title: z.string().min(2).max(120).trim(),
    description: z.string().min(1).max(2000).trim(),
    minTeamSize: z.coerce.number().int().min(1).max(50),
    maxTeamSize: z.coerce.number().int().min(1).max(50),
    note: z.string().max(1000).trim().optional(),
    imageUrl: imageUrlSchema,
  })
  .refine((v) => v.maxTeamSize >= v.minTeamSize, {
    message: "maxTeamSize must be >= minTeamSize",
    path: ["maxTeamSize"],
  });

export type SuggestionFormState =
  | { error?: string; ok?: boolean }
  | undefined;

export async function createGameSuggestionAction(
  _prev: SuggestionFormState,
  formData: FormData,
): Promise<SuggestionFormState> {
  const user = await requireSession();
  const parsed = suggestionSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    minTeamSize: formData.get("minTeamSize"),
    maxTeamSize: formData.get("maxTeamSize"),
    note: formData.get("note") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const submitter = await getUserById(user.id);
  const suggestion = await createGameSuggestion({
    title: parsed.data.title,
    description: parsed.data.description,
    minTeamSize: parsed.data.minTeamSize,
    maxTeamSize: parsed.data.maxTeamSize,
    imageUrl: parsed.data.imageUrl,
    note: parsed.data.note,
    submittedBy: user.id,
    submitterName: submitter?.name ?? user.name ?? "Someone",
    submitterEmail: submitter?.email ?? user.email ?? "",
  });

  const { subject, html } = gameSuggestionEmail({
    fromName: suggestion.submitterName,
    fromEmail: suggestion.submitterEmail,
    title: suggestion.title,
    description: suggestion.description,
    minTeamSize: suggestion.minTeamSize,
    maxTeamSize: suggestion.maxTeamSize,
    note: suggestion.note,
    reviewUrl: `${env.appUrl}/admin/suggestions`,
  });
  await sendEmail({ to: SUGGESTION_NOTIFY_EMAIL, subject, html });

  revalidatePath("/admin/suggestions");
  revalidatePath("/games/suggest");
  return { ok: true };
}

export async function approveGameSuggestionAction(suggestionId: string) {
  const admin = await requireAdminSession();
  const s = await getGameSuggestion(suggestionId);
  if (!s) throw new Error("Suggestion not found");
  if (s.status !== "pending") throw new Error("Already reviewed");

  const game = await createGame({
    title: s.title,
    description: s.description,
    minTeamSize: s.minTeamSize,
    maxTeamSize: s.maxTeamSize,
    imageUrl: s.imageUrl,
    createdBy: admin.id,
  });

  await updateGameSuggestion({
    ...s,
    status: "approved",
    reviewedAt: new Date().toISOString(),
    reviewedBy: admin.id,
    approvedGameId: game.id,
  });

  // Notify everyone about the new game (same as createGameAction).
  const users = await listUsers();
  const recipients = users.map((u) => u.email).filter(Boolean);
  if (recipients.length) {
    const { subject, html } = newGameEmail({
      gameTitle: game.title,
      gameDescription: game.description,
      gameUrl: `${env.appUrl}/games/${game.id}`,
    });
    await sendBulkEmail({ to: recipients, subject, html });
  }

  revalidatePath("/admin/suggestions");
  revalidatePath("/admin/games");
  revalidatePath("/games");
}

export async function rejectGameSuggestionAction(suggestionId: string) {
  const admin = await requireAdminSession();
  const s = await getGameSuggestion(suggestionId);
  if (!s) throw new Error("Suggestion not found");
  if (s.status !== "pending") throw new Error("Already reviewed");
  await updateGameSuggestion({
    ...s,
    status: "rejected",
    reviewedAt: new Date().toISOString(),
    reviewedBy: admin.id,
  });
  revalidatePath("/admin/suggestions");
}

export async function deleteGameSuggestionAction(suggestionId: string) {
  await requireAdminSession();
  await deleteGameSuggestion(suggestionId);
  revalidatePath("/admin/suggestions");
}
