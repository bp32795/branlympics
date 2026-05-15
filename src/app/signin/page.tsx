"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  signInWithCredentials,
  signInWithProvider,
  type AuthFormState,
} from "@/app/actions/auth";

export default function SignInPage() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    signInWithCredentials,
    undefined,
  );
  return (
    <div className="max-w-sm mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Sign in</h1>

      <div className="space-y-2">
        <ProviderButton provider="google" label="Continue with Google" />
        <ProviderButton provider="microsoft-entra-id" label="Continue with Microsoft" />
      </div>

      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <div className="flex-1 h-px bg-zinc-800" />
        OR
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <form action={action} className="space-y-3">
        <Field label="Email" name="email" type="email" required />
        <Field label="Password" name="password" type="password" required />
        {state?.error && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full py-2 rounded-md bg-amber-500 text-black font-semibold hover:bg-amber-400 disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-sm text-zinc-400 text-center">
        No account?{" "}
        <Link href="/signup" className="text-amber-400 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm">
      <span className="text-zinc-300">{label}</span>
      <input
        {...props}
        className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 focus:outline-none focus:border-amber-500"
      />
    </label>
  );
}

function ProviderButton({
  provider,
  label,
}: {
  provider: "google" | "microsoft-entra-id";
  label: string;
}) {
  return (
    <form action={signInWithProvider.bind(null, provider)}>
      <button
        type="submit"
        className="w-full py-2 rounded-md border border-zinc-700 hover:border-amber-400 text-sm"
      >
        {label}
      </button>
    </form>
  );
}
