"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn, signOut, auth } from "@/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail } from "@/lib/repo";

const signupSchema = z.object({
  name: z.string().min(2).max(60).trim(),
  email: z.string().email().trim().toLowerCase(),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters" })
    .max(200),
});

export type AuthFormState = {
  error?: string;
} | undefined;

export async function signUpWithCredentials(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues.map((i) => i.message).join(", ") ||
        "Invalid sign-up details",
    };
  }
  const { name, email, password } = parsed.data;
  if (await getUserByEmail(email)) {
    return { error: "An account with that email already exists. Try signing in." };
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await createUser({
    name,
    email,
    provider: "credentials",
    passwordHash,
  });
  await signIn("credentials", { email, password, redirectTo: "/games" });
  return undefined;
}

const signInSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1),
});

export async function signInWithCredentials(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password" };
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/games",
    });
  } catch (err) {
    // next-auth throws a redirect — re-throw so Next can handle it.
    if ((err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    return { error: "Incorrect email or password" };
  }
  return undefined;
}

export async function signInWithProvider(provider: "google" | "microsoft-entra-id") {
  await signIn(provider, { redirectTo: "/games" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/games");
  return user;
}

export { revalidatePath };
