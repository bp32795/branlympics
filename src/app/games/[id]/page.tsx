import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/app/actions/auth";
import {
  getGame,
  listSignupsForGame,
  listTeamRequestsForGame,
  listUsers,
} from "@/lib/repo";
import { SignupToggleButton } from "@/components/signup-toggle-button";
import {
  SendTeamRequestButton,
  TeamRequestResponseButtons,
} from "@/components/team-request-buttons";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GameDetailPage({ params }: PageProps) {
  const { id } = await params;
  const me = await requireUser();

  const [game, signups, allUsers, teamRequests] = await Promise.all([
    getGame(id),
    listSignupsForGame(id),
    listUsers(),
    listTeamRequestsForGame(id),
  ]);
  if (!game) notFound();

  const usersById = new Map(allUsers.map((u) => [u.id, u]));
  const mySignup = signups.find((s) => s.userId === me.id);
  const isSignedUp = Boolean(mySignup);
  const allowsTeams = game.maxTeamSize > 1;

  // Group signups by team.
  const solo = signups.filter((s) => !s.teamId);
  const teams = new Map<string, typeof signups>();
  for (const s of signups) {
    if (!s.teamId) continue;
    const arr = teams.get(s.teamId) ?? [];
    arr.push(s);
    teams.set(s.teamId, arr);
  }

  // My outgoing pending requests on this game.
  const myOutgoing = me
    ? new Set(
        teamRequests
          .filter(
            (r) => r.fromUserId === me.id && r.status === "pending",
          )
          .map((r) => r.toUserId),
      )
    : new Set<string>();

  // My incoming pending requests on this game.
  const myIncoming = me
    ? teamRequests.filter(
        (r) => r.toUserId === me.id && r.status === "pending",
      )
    : [];

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/games"
          className="text-sm text-zinc-400 hover:text-amber-400"
        >
          ← All games
        </Link>
        <h1 className="text-3xl font-bold mt-2">{game.title}</h1>
        <div className="text-xs text-zinc-500 mt-2 flex flex-wrap gap-3">
          {game.scheduledFor && (
            <span>📅 {new Date(game.scheduledFor).toLocaleString()}</span>
          )}
          {game.location && <span>📍 {game.location}</span>}
          <span>
            👥 {game.minTeamSize === game.maxTeamSize
              ? `${game.minTeamSize} per team`
              : `${game.minTeamSize}–${game.maxTeamSize} per team`}
          </span>
        </div>
        <p className="mt-4 text-zinc-300 whitespace-pre-wrap">
          {game.description}
        </p>
      </div>

      {me ? (
        <div className="border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
          <div className="text-sm text-zinc-300">
            {isSignedUp ? "You're in." : "Wanna play?"}
          </div>
          <SignupToggleButton gameId={game.id} isSignedUp={isSignedUp} />
        </div>
      ) : (
        <div className="border border-zinc-800 rounded-lg p-4 text-sm text-zinc-400">
          <Link href="/signin" className="text-amber-400 hover:underline">
            Sign in
          </Link>{" "}
          to sign up.
        </div>
      )}

      {myIncoming.length > 0 && (
        <section className="border border-amber-500/40 rounded-lg p-4 space-y-2 bg-amber-500/5">
          <h2 className="font-semibold text-amber-300">Team-up requests</h2>
          <ul className="space-y-2">
            {myIncoming.map((r) => {
              const from = usersById.get(r.fromUserId);
              return (
                <li
                  key={r.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    <strong>{from?.name ?? "Someone"}</strong> wants to team up.
                  </span>
                  <TeamRequestResponseButtons requestId={r.id} />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          Signed up ({signups.length})
        </h2>

        {teams.size > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm uppercase tracking-wider text-zinc-500">
              Teams
            </h3>
            <ul className="grid sm:grid-cols-2 gap-2">
              {[...teams.entries()].map(([teamId, members], i) => (
                <li
                  key={teamId}
                  className="border border-zinc-800 rounded-lg p-3"
                >
                  <div className="text-xs uppercase text-amber-400 mb-1">
                    Team {i + 1}
                  </div>
                  <ul className="text-sm space-y-0.5">
                    {members.map((m) => (
                      <li key={m.id}>{usersById.get(m.userId)?.name ?? "?"}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm uppercase tracking-wider text-zinc-500">
            {allowsTeams ? "Solo / unteamed" : "Players"}
          </h3>
          {solo.length === 0 ? (
            <p className="text-sm text-zinc-500">No one yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg">
              {solo.map((s) => {
                const u = usersById.get(s.userId);
                const isMe = me?.id === s.userId;
                return (
                  <li
                    key={s.id}
                    className="px-3 py-2 flex items-center justify-between text-sm"
                  >
                    <span>{u?.name ?? "?"}{isMe && " (you)"}</span>
                    {me && !isMe && allowsTeams && (
                      <SendTeamRequestButton
                        gameId={game.id}
                        toUserId={s.userId}
                        alreadyRequested={myOutgoing.has(s.userId)}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
