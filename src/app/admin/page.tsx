import { requireAdmin } from "@/app/actions/auth";
import { listGames } from "@/lib/repo";
import { AddGameForm } from "@/components/admin-game-forms";
import { SortableActivityList } from "@/components/sortable-activity-list";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const activities = await listGames();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Saturday itinerary</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Add a Saturday time to include an activity, then drag activities into
          the order you want shown publicly.
        </p>
      </div>

      <AddGameForm />

      <section className="space-y-2">
        <h2 className="font-semibold">Activities ({activities.length})</h2>
        {activities.length === 0 ? (
          <p className="text-sm text-zinc-500">None yet.</p>
        ) : (
          <SortableActivityList
            key={activities
              .map((activity) =>
                [activity.id, activity.title, activity.scheduledFor].join(":"),
              )
              .join("|")}
            activities={activities}
          />
        )}
      </section>
    </div>
  );
}
