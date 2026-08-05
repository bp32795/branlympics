import { requireAdmin } from "@/app/actions/auth";
import { listGames } from "@/lib/repo";
import {
  AddGameForm,
  DeleteGameButton,
  EditGameForm,
} from "@/components/admin-game-forms";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const activities = await listGames();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Saturday itinerary</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Add a Saturday time to include an activity. The public itinerary is
          sorted chronologically.
        </p>
      </div>

      <AddGameForm />

      <section className="space-y-2">
        <h2 className="font-semibold">Activities ({activities.length})</h2>
        {activities.length === 0 ? (
          <p className="text-sm text-zinc-500">None yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg">
            {activities.map((activity) => (
              <li
                key={activity.id}
                className="px-3 py-3 flex flex-col gap-3 text-sm sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex items-start gap-3 flex-1">
                  {activity.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activity.imageUrl}
                      alt=""
                      className="h-12 w-12 rounded object-cover border border-fuchsia-500/30"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{activity.title}</p>
                    <div className="mt-2">
                      <EditGameForm game={activity} />
                    </div>
                  </div>
                </div>
                <DeleteGameButton gameId={activity.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
