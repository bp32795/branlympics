import NextAuth, { type DefaultSession } from "next-auth";
import "next-auth/jwt";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createUser, getUserByEmail, getUserById } from "@/lib/repo";
import type { AuthProvider } from "@/lib/models";

// Augment session.user with our app-specific fields.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isAdmin?: boolean;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
    Credentials({
      name: "Email + password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await getUserByEmail(email);
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, ensure a user row exists.
      if (!account || account.provider === "credentials") return true;
      if (!user.email) return false;
      const existing = await getUserByEmail(user.email);
      if (!existing) {
        await createUser({
          email: user.email,
          name: user.name ?? user.email,
          image: user.image ?? undefined,
          provider: account.provider as AuthProvider,
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      // On initial sign-in `user` is set. Load fresh app user by email so
      // we attach our internal id + admin flag regardless of provider.
      const email =
        user?.email ?? (typeof token.email === "string" ? token.email : null);
      if (email && (!token.id || user)) {
        const dbUser = await getUserByEmail(email);
        if (dbUser) {
          token.id = dbUser.id;
          token.isAdmin = dbUser.isAdmin;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.picture = dbUser.image;
        }
      } else if (token.id && !user) {
        // Refresh admin flag occasionally — cheap point read.
        const dbUser = await getUserById(token.id);
        if (dbUser) token.isAdmin = dbUser.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id;
      session.user.isAdmin = Boolean(token.isAdmin);
      return session;
    },
  },
});
