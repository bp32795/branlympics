"use client";

import { useTransition } from "react";
import { toggleSignupAction } from "@/app/actions/games";

export function SignupToggleButton({
  gameId,
  isSignedUp,
  className,
}: {
  gameId: string;
  isSignedUp: boolean;
  className?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => toggleSignupAction(gameId))}
      className={
        className ??
        (isSignedUp
          ? "px-4 py-2 rounded-md border border-amber-500 text-amber-400 hover:bg-amber-500/10 disabled:opacity-50"
          : "px-4 py-2 rounded-md bg-amber-500 text-black font-semibold hover:bg-amber-400 disabled:opacity-50")
      }
    >
      {pending ? "…" : isSignedUp ? "✓ Signed up — click to remove" : "I'm in"}
    </button>
  );
}
