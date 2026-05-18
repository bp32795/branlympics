import Link from "next/link";
import { listGames, listSignupsForUser } from "@/lib/repo";
import { requireUser } from "@/app/actions/auth";
import { SignupToggleButton } from "@/components/signup-toggle-button";
import { BulkSignupPanel } from "@/components/bulk-signup-panel";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const me = await requireUser();
  const userId = me.id;
  const [games, mySignups] = await Promise.all([
    listGames(),
    listSignupsForUser(userId),
  ]);
  const signedUp = new Set(mySignups.map((s) => s.gameId));

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold">Games</h1>
        {me.isAdmin && (
          <Link
            href="/admin/games"
            className="text-sm text-fuchsia-300 hover:underline"
          >
            + Add a game
          </Link>
        )}
      </div>

      {games.length === 0 && (
        <p className="text-zinc-500">No games yet — check back soon.</p>
      )}

      {games.length > 0 && (
        <BulkSignupPanel
          games={games.map((g) => ({
            id: g.id,
            title: g.title,
            alreadySignedUp: signedUp.has(g.id),
          }))}
        />
      )}

      <ul className="space-y-3">
        {games.map((g) => (
          <li
            key={g.id}
            className="border border-zinc-800 rounded-lg p-4 hover:border-fuchsia-500/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              {g.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <Link href={`/games/${g.id}`} className="shrink-0">
                  <img
                    src={g.imageUrl}
                    alt=""
                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-md object-cover border border-fuchsia-500/30 shadow-[0_0_18px_rgba(255,43,214,0.15)]"
                  />
                </Link>
              )}
              <div className="flex-1">
                <Link
                  href={`/games/${g.id}`}
                  className="text-xl font-semibold hover:text-fuchsia-300"
                >
                  {g.title}
                </Link>
                <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
                  {g.description}
                </p>
                <div className="text-xs text-zinc-500 mt-2 flex flex-wrap gap-3">
                  {g.scheduledFor && (
                    <span>📅 {new Date(g.scheduledFor).toLocaleString()}</span>
                  )}
                  {g.location && <span>📍 {g.location}</span>}
                  <span>
                    👥 {g.minTeamSize === g.maxTeamSize
                      ? `${g.minTeamSize} per team`
                      : `${g.minTeamSize}–${g.maxTeamSize} per team`}
                  </span>
                </div>
              </div>
              {(
                <SignupToggleButton
                  gameId={g.id}
                  isSignedUp={signedUp.has(g.id)}
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
