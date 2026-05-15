"use client";

import { useActionState, useTransition } from "react";
import {
  createGameAction,
  deleteGameAction,
  type GameFormState,
} from "@/app/actions/games";

export function AddGameForm() {
  const [state, action, pending] = useActionState<GameFormState, FormData>(
    createGameAction,
    undefined,
  );
  return (
    <form action={action} className="space-y-3 border border-zinc-800 rounded-lg p-4">
      <h2 className="font-semibold">New game</h2>
      <Field label="Title" name="title" required />
      <label className="block text-sm">
        <span className="text-zinc-300">Description</span>
        <textarea
          name="description"
          required
          rows={4}
          className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 focus:outline-none focus:border-amber-500"
        />
      </label>
      <Field label="Location (optional)" name="location" />
      <Field
        label="When (optional)"
        name="scheduledFor"
        type="datetime-local"
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Min team size" name="minTeamSize" type="number" defaultValue={1} min={1} required />
        <Field label="Max team size" name="maxTeamSize" type="number" defaultValue={1} min={1} required />
      </div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 rounded-md bg-amber-500 text-black font-semibold hover:bg-amber-400 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add game + notify everyone"}
      </button>
    </form>
  );
}

export function DeleteGameButton({ gameId }: { gameId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this game and all signups?")) return;
        start(() => deleteGameAction(gameId));
      }}
      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
    >
      {pending ? "…" : "Delete"}
    </button>
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
