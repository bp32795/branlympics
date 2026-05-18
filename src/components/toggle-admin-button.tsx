"use client";

import { useTransition } from "react";
import { setUserAdminAction } from "@/app/actions/games";

export function ToggleAdminButton({
  userId,
  isAdmin,
  disabled,
}: {
  userId: string;
  isAdmin: boolean;
  disabled?: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending || disabled}
      onClick={() => start(() => setUserAdminAction(userId, !isAdmin))}
      className="text-xs px-2.5 py-1 rounded border border-zinc-700 hover:border-fuchsia-300 disabled:opacity-50"
    >
      {pending ? "…" : isAdmin ? "Revoke admin" : "Make admin"}
    </button>
  );
}
