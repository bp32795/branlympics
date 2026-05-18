import Link from "next/link";

export default function HomePage() {
  return (
    <div className="text-center py-16 space-y-10">
      <div>
        <h1 className="neon-title text-5xl md:text-7xl font-black tracking-tight">
          BRANLYMPICS
        </h1>
        <p className="mt-4 text-zinc-400">
          <span className="neon-cyan">Invite only.</span> Sign in to continue.
        </p>
      </div>

      <div className="flex gap-3 justify-center">
        <Link
          href="/signin"
          className="neon-btn px-6 py-3 rounded-md font-bold tracking-wide"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="px-6 py-3 rounded-md border border-fuchsia-500/60 text-fuchsia-200 hover:border-fuchsia-300 hover:text-white hover:shadow-[0_0_18px_rgba(255,43,214,0.45)] transition"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}
