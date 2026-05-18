"use client";

import { useTransition } from "react";
import {
  respondToTeamRequestAction,
  sendTeamRequestAction,
} from "@/app/actions/games";

export function SendTeamRequestButton({
  gameId,
  toUserId,
  alreadyRequested,
}: {
  gameId: string;
  toUserId: string;
  alreadyRequested: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending || alreadyRequested}
      onClick={() => start(() => sendTeamRequestAction(gameId, toUserId))}
      className="text-xs px-2.5 py-1 rounded border border-zinc-700 hover:border-fuchsia-300 disabled:opacity-50"
    >
      {alreadyRequested ? "Requested" : pending ? "…" : "Team up"}
    </button>
  );
}

export function TeamRequestResponseButtons({
  requestId,
}: {
  requestId: string;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => respondToTeamRequestAction(requestId, true))}
        className="text-xs px-2.5 py-1 rounded bg-emerald-500 text-black font-semibold hover:bg-emerald-400 disabled:opacity-50"
      >
        Accept
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => respondToTeamRequestAction(requestId, false))}
        className="text-xs px-2.5 py-1 rounded border border-zinc-700 hover:border-red-400 disabled:opacity-50"
      >
        Decline
      </button>
    </div>
  );
}
