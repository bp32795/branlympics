"use client";

import { useActionState } from "react";
import {
  createGameSuggestionAction,
  type SuggestionFormState,
} from "@/app/actions/games";
import { GameImagePicker } from "@/components/game-image-picker";

export function SuggestGameForm() {
  const [state, action, pending] = useActionState<SuggestionFormState, FormData>(
    createGameSuggestionAction,
    undefined,
  );
  return (
    <form
      action={action}
      className="space-y-3 border border-zinc-800 rounded-lg p-4"
    >
      <h2 className="font-semibold">Suggest a game</h2>
      <p className="text-xs text-zinc-500">
        Got an idea? Send it to the admins for review.
      </p>
      <Field label="Title" name="title" required />
      <label className="block text-sm">
        <span className="text-zinc-300">Description</span>
        <textarea
          name="description"
          required
          rows={4}
          className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 focus:outline-none focus:border-fuchsia-500"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Min team size"
          name="minTeamSize"
          type="number"
          defaultValue={1}
          min={1}
          required
        />
        <Field
          label="Max team size"
          name="maxTeamSize"
          type="number"
          defaultValue={1}
          min={1}
          required
        />
      </div>
      <label className="block text-sm">
        <span className="text-zinc-300">Note to admins (optional)</span>
        <textarea
          name="note"
          rows={2}
          className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 focus:outline-none focus:border-fuchsia-500"
        />
      </label>
      <GameImagePicker label="Game photo (optional)" />
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.ok && (
        <p className="text-sm text-emerald-400">
          Suggestion sent — thanks! Admins will review it.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 rounded-md bg-fuchsia-500 text-black font-semibold hover:bg-fuchsia-300 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send suggestion"}
      </button>
    </form>
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
