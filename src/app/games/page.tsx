import Link from "next/link";
import { auth } from "@/auth";
import { listGames, listSignupsForUser } from "@/lib/repo";
import { SignupToggleButton } from "@/components/signup-toggle-button";
import { BulkSignupPanel } from "@/components/bulk-signup-panel";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const [games, mySignups] = await Promise.all([
    listGames(),
    userId ? listSignupsForUser(userId) : Promise.resolve([]),
  ]);
  const signedUp = new Set(mySignups.map((s) => s.gameId));

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold">Games</h1>
        {session?.user?.isAdmin && (
          <Link
            href="/admin/games"
            className="text-sm text-amber-400 hover:underline"
          >
            + Add a game
          </Link>
        )}
      </div>

      {!session && (
        <div className="border border-zinc-800 rounded-lg p-4 text-sm text-zinc-400">
          <Link href="/signin" className="text-amber-400 hover:underline">
            Sign in
          </Link>{" "}
          to sign up for games and team up.
        </div>
      )}

      {games.length === 0 && (
        <p className="text-zinc-500">No games yet — check back soon.</p>
      )}

      {userId && games.length > 0 && (
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
            className="border border-zinc-800 rounded-lg p-4 hover:border-amber-500/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Link
                  href={`/games/${g.id}`}
                  className="text-xl font-semibold hover:text-amber-300"
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
              {userId && (
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
