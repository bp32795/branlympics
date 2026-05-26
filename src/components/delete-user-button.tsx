"use client";

import { useTransition } from "react";
import { deleteUserAction } from "@/app/actions/games";

export function DeleteUserButton({
  userId,
  userName,
  disabled,
}: {
  userId: string;
  userName: string;
  disabled?: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending || disabled}
      onClick={() => {
        if (
          !confirm(
            `Delete ${userName}? This removes their account, signups, and team requests. This cannot be undone.`,
          )
        ) {
          return;
        }
        start(() => deleteUserAction(userId));
      }}
      className="text-xs px-2.5 py-1 rounded border border-zinc-700 hover:border-red-400 hover:text-red-300 disabled:opacity-50"
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}
