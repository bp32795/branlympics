import Link from "next/link";

export default function HomePage() {
  return (
    <div className="text-center py-12 space-y-8">
      <div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-amber-400">
          BRANLYMPICS
        </h1>
        <p className="mt-3 text-zinc-400 text-lg">
          Bachelor party games · winners · suffering
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
        <InfoCard label="When" value="Aug 7 – 10, 2026" />
        <InfoCard
          label="Where"
          value="The Airbnb"
          href="https://www.airbnb.com/rooms/1414232382068578587?unique_share_id=0ad67628-183c-4abc-9e9c-1a8881d18cef&viralityEntryPoint=1&s=76"
        />
        <InfoCard label="What" value="Many games. One champion." />
      </div>

      <div className="flex gap-3 justify-center pt-4">
        <Link
          href="/games"
          className="px-5 py-2.5 rounded-md bg-amber-500 text-black font-semibold hover:bg-amber-400"
        >
          Browse games
        </Link>
        <Link
          href="/signup"
          className="px-5 py-2.5 rounded-md border border-zinc-700 hover:border-amber-400"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <div className="border border-zinc-800 rounded-lg p-4 hover:border-amber-500 transition-colors h-full">
      <div className="text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer">
      {body}
    </a>
  ) : (
    body
  );
}
