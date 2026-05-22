"use client";

import { useTransition } from "react";
import {
  approveGameSuggestionAction,
  deleteGameSuggestionAction,
  rejectGameSuggestionAction,
} from "@/app/actions/games";

export function SuggestionReviewButtons({
  suggestionId,
}: {
  suggestionId: string;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => approveGameSuggestionAction(suggestionId))}
        className="px-3 py-1.5 text-xs rounded-md bg-fuchsia-500 text-black font-semibold hover:bg-fuchsia-300 disabled:opacity-50"
      >
        {pending ? "…" : "Approve + create game"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => rejectGameSuggestionAction(suggestionId))}
        className="px-3 py-1.5 text-xs rounded-md border border-zinc-700 text-zinc-300 hover:border-zinc-500 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}

export function DeleteSuggestionButton({
  suggestionId,
}: {
  suggestionId: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this suggestion?")) return;
        start(() => deleteGameSuggestionAction(suggestionId));
      }}
      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}
