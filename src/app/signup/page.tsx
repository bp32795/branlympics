"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  signUpWithCredentials,
  signInWithProvider,
  type AuthFormState,
} from "@/app/actions/auth";

export default function SignUpPage() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    signUpWithCredentials,
    undefined,
  );
  return (
    <div className="max-w-sm mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Create your account</h1>

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
        <Field label="Name" name="name" required minLength={2} />
        <Field label="Email" name="email" type="email" required />
        <Field
          label="Password (8+ chars)"
          name="password"
          type="password"
          required
          minLength={8}
        />
        {state?.error && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full py-2 rounded-md bg-fuchsia-500 text-black font-semibold hover:bg-fuchsia-300 disabled:opacity-50"
        >
          {pending ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <p className="text-sm text-zinc-400 text-center">
        Already have an account?{" "}
        <Link href="/signin" className="text-fuchsia-300 hover:underline">
          Sign in
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
        className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 focus:outline-none focus:border-fuchsia-500"
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
        className="w-full py-2 rounded-md border border-zinc-700 hover:border-fuchsia-300 text-sm"
      >
        {label}
      </button>
    </form>
  );
}
