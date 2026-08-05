import type { Metadata } from "next";
import { listGames } from "@/lib/repo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saturday Itinerary · Branlympics",
  description: "The Branlympics Saturday schedule.",
};

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Los_Angeles",
});

function formatTime(value: string) {
  const hasTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value);
  const date = new Date(hasTimeZone ? value : `${value}:00-07:00`);
  return Number.isNaN(date.valueOf()) ? value : timeFormatter.format(date);
}

export default async function ItineraryPage() {
  const activities = (await listGames()).filter(
    (activity) => activity.scheduledFor,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="neon-cyan text-sm font-bold uppercase tracking-widest">
          Las Vegas
        </p>
        <h1 className="neon-title mt-3 text-4xl md:text-5xl font-black">
          Saturday itinerary
        </h1>
      </header>

      {activities.length === 0 ? (
        <p className="border-l-2 border-fuchsia-500 pl-4 text-zinc-400">
          The Saturday schedule is still being finalized. Check back soon.
        </p>
      ) : (
        <ol className="relative border-l border-fuchsia-500/50 ml-3 space-y-8">
          {activities.map((activity) => (
            <li key={activity.id} className="relative pl-8">
              <span className="absolute -left-2 top-1.5 h-4 w-4 rounded-full border-2 border-fuchsia-300 bg-[#050007] shadow-[0_0_12px_rgba(255,43,214,0.8)]" />
              <time className="neon-cyan text-sm font-bold">
                {formatTime(activity.scheduledFor!)}
              </time>
              <h2 className="mt-1 text-2xl font-bold">{activity.title}</h2>
              {activity.location && (
                <p className="mt-1 text-sm text-fuchsia-200">
                  {activity.location}
                </p>
              )}
              {activity.description && (
                <p className="mt-2 whitespace-pre-line text-zinc-400">
                  {activity.description}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
