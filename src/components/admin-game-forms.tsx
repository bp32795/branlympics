"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createGameAction,
  deleteGameAction,
  setGameImageAction,
  updateGameAction,
  type GameFormState,
  type ImageFormState,
  type UpdateGameFormState,
} from "@/app/actions/games";
import { GameImagePicker } from "@/components/game-image-picker";
import type { Game } from "@/lib/models";

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
          className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 focus:outline-none focus:border-fuchsia-500"
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
      <GameImagePicker />
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 rounded-md bg-fuchsia-500 text-black font-semibold hover:bg-fuchsia-300 disabled:opacity-50"
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
        className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 focus:outline-none focus:border-fuchsia-500"
      />
    </label>
  );
}

export function GamePhotoForm({
  gameId,
  initial,
}: {
  gameId: string;
  initial?: string;
}) {
  const [state, action, pending] = useActionState<ImageFormState, FormData>(
    setGameImageAction,
    undefined,
  );
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="gameId" value={gameId} />
      <GameImagePicker initial={initial} label="Game photo" />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-3 py-1.5 text-sm rounded-md bg-fuchsia-500 text-black font-semibold hover:bg-fuchsia-300 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save photo"}
        </button>
        {state?.error && <span className="text-xs text-red-400">{state.error}</span>}
        {state?.ok && <span className="text-xs text-fuchsia-300">Saved.</span>}
      </div>
    </form>
  );
}

/** Format an ISO datetime string for a <input type="datetime-local">. */
function toDatetimeLocal(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditGameForm({ game }: { game: Game }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<UpdateGameFormState, FormData>(
    updateGameAction,
    undefined,
  );
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-fuchsia-300 hover:text-fuchsia-200 underline-offset-2 hover:underline"
      >
        Edit
      </button>
    );
  }
  return (
    <form
      action={action}
      className="space-y-3 border border-fuchsia-500/30 rounded-md p-3 bg-fuchsia-500/5"
    >
      <input type="hidden" name="gameId" value={game.id} />
      <Field label="Title" name="title" defaultValue={game.title} required />
      <label className="block text-sm">
        <span className="text-zinc-300">Description</span>
        <textarea
          name="description"
          required
          rows={4}
          defaultValue={game.description}
          className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 focus:outline-none focus:border-fuchsia-500"
        />
      </label>
      <Field
        label="Location (optional)"
        name="location"
        defaultValue={game.location ?? ""}
      />
      <Field
        label="When (optional)"
        name="scheduledFor"
        type="datetime-local"
        defaultValue={toDatetimeLocal(game.scheduledFor)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Min team size"
          name="minTeamSize"
          type="number"
          defaultValue={game.minTeamSize}
          min={1}
          required
        />
        <Field
          label="Max team size"
          name="maxTeamSize"
          type="number"
          defaultValue={game.maxTeamSize}
          min={1}
          required
        />
      </div>
      <GameImagePicker initial={game.imageUrl} label="Game photo" />
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-3 py-1.5 text-sm rounded-md bg-fuchsia-500 text-black font-semibold hover:bg-fuchsia-300 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-sm rounded-md border border-zinc-700 text-zinc-300 hover:border-zinc-500"
        >
          Close
        </button>
        {state?.ok && <span className="text-xs text-fuchsia-300">Saved.</span>}
      </div>
    </form>
  );
}
