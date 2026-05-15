"use client";

import { useState, useTransition } from "react";
import { bulkSignupAction } from "@/app/actions/games";

interface GameLite {
  id: string;
  title: string;
  alreadySignedUp: boolean;
}

export function BulkSignupPanel({ games }: { games: GameLite[] }) {
  const initial = new Set(games.filter((g) => g.alreadySignedUp).map((g) => g.id));
  const [selected, setSelected] = useState<Set<string>>(initial);
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  function toggle(id: string) {
    setDone(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setDone(false);
    setSelected(new Set(games.map((g) => g.id)));
  }
  function selectNone() {
    setDone(false);
    setSelected(new Set());
  }

  function submit() {
    const toAdd = [...selected].filter(
      (id) => !games.find((g) => g.id === id)?.alreadySignedUp,
    );
    if (toAdd.length === 0) {
      setDone(true);
      return;
    }
    start(async () => {
      await bulkSignupAction(toAdd);
      setDone(true);
    });
  }

  return (
    <div className="border border-zinc-800 rounded-lg p-4 space-y-3 bg-zinc-900/40">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Bulk sign-up</h2>
        <div className="text-xs text-zinc-400 flex gap-3">
          <button onClick={selectAll} className="hover:text-amber-400">
            Select all
          </button>
          <button onClick={selectNone} className="hover:text-amber-400">
            Clear
          </button>
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        Tick every game you want to play, then commit in one click. Already-signed-up
        games are pre-checked.
      </p>
      <ul className="grid sm:grid-cols-2 gap-1.5">
        {games.map((g) => (
          <li key={g.id}>
            <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-amber-300">
              <input
                type="checkbox"
                checked={selected.has(g.id)}
                onChange={() => toggle(g.id)}
                className="accent-amber-500"
              />
              <span className={g.alreadySignedUp ? "text-amber-400" : ""}>
                {g.title}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="px-4 py-2 rounded-md bg-amber-500 text-black font-semibold hover:bg-amber-400 disabled:opacity-50"
        >
          {pending ? "Signing up…" : "Sign me up for all selected"}
        </button>
        {done && !pending && (
          <span className="text-sm text-emerald-400">Done ✓</span>
        )}
      </div>
    </div>
  );
}
