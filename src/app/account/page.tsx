import Link from "next/link";
import { requireUser } from "@/app/actions/auth";
import {
  getGame,
  listIncomingTeamRequests,
  listOutgoingTeamRequests,
  listSignupsForUser,
  getUserById,
} from "@/lib/repo";
import { TeamRequestResponseButtons } from "@/components/team-request-buttons";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const me = await requireUser();
  const [signups, incoming, outgoing] = await Promise.all([
    listSignupsForUser(me.id),
    listIncomingTeamRequests(me.id),
    listOutgoingTeamRequests(me.id),
  ]);

  const games = await Promise.all(signups.map((s) => getGame(s.gameId)));
  const reqGames = await Promise.all(
    [...incoming, ...outgoing].map((r) => getGame(r.gameId)),
  );
  const fromUsers = await Promise.all(
    incoming.map((r) => getUserById(r.fromUserId)),
  );
  const toUsers = await Promise.all(
    outgoing.map((r) => getUserById(r.toUserId)),
  );
  const gameMap = new Map(
    reqGames.filter(Boolean).map((g) => [g!.id, g!]),
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">My signups</h1>

      <section>
        <h2 className="font-semibold mb-2">Games I'm in</h2>
        {games.length === 0 ? (
          <p className="text-sm text-zinc-500">
            None yet — <Link href="/games" className="text-fuchsia-300 hover:underline">browse games</Link>.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg">
            {games.map(
              (g, i) =>
                g && (
                  <li key={signups[i].id} className="px-3 py-2 text-sm">
                    <Link href={`/games/${g.id}`} className="hover:text-fuchsia-300">
                      {g.title}
                    </Link>
                    {signups[i].teamId && (
                      <span className="ml-2 text-xs text-fuchsia-300">teamed up</span>
                    )}
                  </li>
                ),
            )}
          </ul>
        )}
      </section>

      {incoming.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">Incoming team-up requests</h2>
          <ul className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg">
            {incoming.map((r, i) => {
              const g = gameMap.get(r.gameId);
              return (
                <li
                  key={r.id}
                  className="px-3 py-2 flex items-center justify-between text-sm"
                >
                  <span>
                    <strong>{fromUsers[i]?.name ?? "Someone"}</strong> for{" "}
                    <Link href={`/games/${r.gameId}`} className="hover:text-fuchsia-300">
                      {g?.title ?? "a game"}
                    </Link>
                  </span>
                  <TeamRequestResponseButtons requestId={r.id} />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">Requests I've sent</h2>
          <ul className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg">
            {outgoing.map((r, i) => {
              const g = gameMap.get(r.gameId);
              return (
                <li
                  key={r.id}
                  className="px-3 py-2 flex items-center justify-between text-sm"
                >
                  <span>
                    To <strong>{toUsers[i]?.name ?? "?"}</strong> for{" "}
                    <Link href={`/games/${r.gameId}`} className="hover:text-fuchsia-300">
                      {g?.title ?? "a game"}
                    </Link>
                  </span>
                  <span className="text-xs text-zinc-500">{r.status}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
