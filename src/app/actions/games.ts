"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import {
  createGame,
  createSignup,
  createTeamRequest,
  deleteGame,
  deleteSignup,
  getGame,
  getSignup,
  getTeamRequest,
  getUserById,
  listSignupsForGame,
  listUsers,
  setSignupTeam,
  updateGameImage,
  updateTeamRequestStatus,
  updateUser,
} from "@/lib/repo";
import { newGameEmail, sendEmail, teamRequestEmail } from "@/lib/email";
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
    await sendEmail({ to: recipients, subject, html });
  }

  revalidatePath("/games");
  revalidatePath("/admin/games");
  return undefined;
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

// Re-export for tests.
export { listSignupsForGame };
