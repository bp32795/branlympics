import Link from "next/link";
import { requireUser } from "@/app/actions/auth";
import { SuggestGameForm } from "@/components/suggest-game-form";

export const dynamic = "force-dynamic";

export default async function SuggestGamePage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold">Suggest a game</h1>
        <Link
          href="/games"
          className="text-sm text-fuchsia-300 hover:underline"
        >
          ← Back to games
        </Link>
      </div>
      <SuggestGameForm />
    </div>
  );
}
