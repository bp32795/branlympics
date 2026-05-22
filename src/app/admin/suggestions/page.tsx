import Link from "next/link";
import { requireAdmin } from "@/app/actions/auth";
import { listGameSuggestions } from "@/lib/repo";
import {
  DeleteSuggestionButton,
  SuggestionReviewButtons,
} from "@/components/suggestion-admin-actions";

export const dynamic = "force-dynamic";

export default async function AdminSuggestionsPage() {
  await requireAdmin();
  const all = await listGameSuggestions();
  const pending = all.filter((s) => s.status === "pending");
  const reviewed = all.filter((s) => s.status !== "pending");

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold">Admin · Suggestions</h1>
        <div className="flex gap-4 text-sm">
          <Link
            href="/admin/games"
            className="text-fuchsia-300 hover:underline"
          >
            Manage games →
          </Link>
          <Link
            href="/admin/users"
            className="text-fuchsia-300 hover:underline"
          >
            Manage users →
          </Link>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-zinc-500">Nothing waiting.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((s) => (
              <li
                key={s.id}
                className="border border-fuchsia-500/30 rounded-lg p-4 bg-fuchsia-500/5 space-y-2"
              >
                <div className="flex items-start gap-3">
                  {s.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.imageUrl}
                      alt=""
                      className="h-16 w-16 rounded object-cover border border-fuchsia-500/30"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{s.title}</div>
                    <div className="text-xs text-zinc-400">
                      from {s.submitterName}{" "}
                      <span className="text-zinc-600">
                        ({s.submitterEmail})
                      </span>{" "}
                      · {new Date(s.createdAt).toLocaleString()}
                    </div>
                    <p className="text-sm text-zinc-300 mt-2 whitespace-pre-wrap">
                      {s.description}
                    </p>
                    <div className="text-xs text-zinc-500 mt-1">
                      👥{" "}
                      {s.minTeamSize === s.maxTeamSize
                        ? `${s.minTeamSize} per team`
                        : `${s.minTeamSize}–${s.maxTeamSize} per team`}
                    </div>
                    {s.note && (
                      <p className="text-xs text-zinc-400 mt-2 italic">
                        Note: {s.note}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <SuggestionReviewButtons suggestionId={s.id} />
                  <DeleteSuggestionButton suggestionId={s.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Reviewed ({reviewed.length})</h2>
        {reviewed.length === 0 ? (
          <p className="text-sm text-zinc-500">None yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg">
            {reviewed.map((s) => (
              <li
                key={s.id}
                className="px-3 py-3 flex items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{s.title}</span>
                    <span
                      className={
                        s.status === "approved"
                          ? "text-xs text-emerald-400"
                          : "text-xs text-zinc-500"
                      }
                    >
                      {s.status}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500">
                    from {s.submitterName} ·{" "}
                    {s.reviewedAt
                      ? new Date(s.reviewedAt).toLocaleString()
                      : ""}
                  </div>
                </div>
                {s.status === "approved" && s.approvedGameId && (
                  <Link
                    href={`/games/${s.approvedGameId}`}
                    className="text-xs text-fuchsia-300 hover:underline"
                  >
                    View game →
                  </Link>
                )}
                <DeleteSuggestionButton suggestionId={s.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
