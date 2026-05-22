import Link from "next/link";
import { requireAdmin } from "@/app/actions/auth";
import { listGames } from "@/lib/repo";
import {
  AddGameForm,
  DeleteGameButton,
  EditGameForm,
} from "@/components/admin-game-forms";

export const dynamic = "force-dynamic";

export default async function AdminGamesPage() {
  await requireAdmin();
  const games = await listGames();
  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold">Admin · Games</h1>
        <div className="flex gap-4 text-sm">
          <Link
            href="/admin/suggestions"
            className="text-fuchsia-300 hover:underline"
          >
            Review suggestions →
          </Link>
          <Link
            href="/admin/users"
            className="text-fuchsia-300 hover:underline"
          >
            Manage users →
          </Link>
        </div>
      </div>
      <AddGameForm />
      <section className="space-y-2">
        <h2 className="font-semibold">Existing games ({games.length})</h2>
        {games.length === 0 ? (
          <p className="text-sm text-zinc-500">None yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg">
            {games.map((g) => (
              <li
                key={g.id}
                className="px-3 py-3 flex flex-col gap-3 text-sm sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex items-start gap-3 flex-1">
                  {g.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={g.imageUrl}
                      alt=""
                      className="h-12 w-12 rounded object-cover border border-fuchsia-500/30"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/games/${g.id}`}
                      className="hover:text-fuchsia-300 font-medium"
                    >
                      {g.title}
                    </Link>
                    <div className="mt-2">
                      <EditGameForm game={g} />
                    </div>
                  </div>
                </div>
                <DeleteGameButton gameId={g.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
