import Link from "next/link";
import { requireAdmin } from "@/app/actions/auth";
import { listGames } from "@/lib/repo";
import {
  AddGameForm,
  DeleteGameButton,
} from "@/components/admin-game-forms";

export const dynamic = "force-dynamic";

export default async function AdminGamesPage() {
  await requireAdmin();
  const games = await listGames();
  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold">Admin · Games</h1>
        <Link
          href="/admin/users"
          className="text-sm text-amber-400 hover:underline"
        >
          Manage users →
        </Link>
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
                className="px-3 py-2 flex items-center justify-between text-sm"
              >
                <Link
                  href={`/games/${g.id}`}
                  className="hover:text-amber-300"
                >
                  {g.title}
                </Link>
                <DeleteGameButton gameId={g.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
