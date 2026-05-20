import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Location · Branlympics",
  description: "Where and when the Branlympics go down.",
};

const AIRBNB_URL = "https://www.airbnb.com/rooms/1414232382068578587";

export default function LocationPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="neon-title text-4xl md:text-5xl font-black tracking-tight">
          Location Details
        </h1>
        <p className="mt-2 text-zinc-400">
          Where we crash and where the chaos goes down.
        </p>
      </div>

      <section className="border border-fuchsia-500/40 rounded-lg p-5 bg-fuchsia-500/5 shadow-[0_0_28px_rgba(255,43,214,0.15)] space-y-2">
        <h2 className="text-sm uppercase tracking-widest text-fuchsia-300">
          Dates
        </h2>
        <p className="text-2xl font-bold">August 7 – 10</p>
        <p className="text-sm text-zinc-400">
          Friday through Monday. Plan travel accordingly.
        </p>
      </section>

      <section className="border border-zinc-800 rounded-lg p-5 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-fuchsia-300">
          Airbnb
        </h2>
        <p className="text-zinc-300">
          We&apos;re staying at this spot for the weekend:
        </p>
        <a
          href={AIRBNB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block neon-btn px-5 py-2.5 rounded-md font-bold tracking-wide"
        >
          View the Airbnb →
        </a>
        <p className="text-xs text-zinc-500 break-all">
          <a
            href={AIRBNB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-fuchsia-300 underline-offset-2 hover:underline"
          >
            {AIRBNB_URL}
          </a>
        </p>
      </section>
    </div>
  );
}
