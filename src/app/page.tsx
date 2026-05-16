import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/games");
  }

  return (
    <div className="text-center py-16 space-y-10">
      <div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-amber-400">
          BRANLYMPICS
        </h1>
        <p className="mt-4 text-zinc-400">Invite only. Sign in to continue.</p>
      </div>

      <div className="flex gap-3 justify-center">
        <Link
          href="/signin"
          className="px-6 py-3 rounded-md bg-amber-500 text-black font-semibold hover:bg-amber-400"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="px-6 py-3 rounded-md border border-zinc-700 hover:border-amber-400"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}
