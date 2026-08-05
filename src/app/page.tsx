import Link from "next/link";

const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=3110%20S%20Tenaya%20Way%2C%20Las%20Vegas%2C%20NV";

export default function HomePage() {
  return (
    <div className="py-12 md:py-20 space-y-12">
      <div className="text-center">
        <p className="neon-cyan text-sm font-bold uppercase tracking-widest">
          Las Vegas · August 7–10
        </p>
        <h1 className="neon-title mt-4 text-4xl md:text-7xl font-black tracking-tight">
          BRANLYMPICS
        </h1>
        <p className="mt-5 text-lg text-zinc-300">
          Home base for the weekend.
        </p>
      </div>

      <section className="mx-auto max-w-2xl border border-fuchsia-500/40 rounded-lg bg-black/40 p-6 md:p-8 text-center shadow-[0_0_28px_rgba(255,43,214,0.15)]">
        <p className="text-sm font-bold uppercase tracking-widest text-fuchsia-300">
          Airbnb
        </p>
        <address className="mt-3 not-italic text-2xl md:text-3xl font-bold">
          3110 S Tenaya Way
          <br />
          Las Vegas, NV
        </address>
        <a
          href={MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="neon-btn mt-6 inline-block px-6 py-3 rounded-md font-bold"
        >
          Open in Google Maps
        </a>
      </section>

      <div className="text-center">
        <Link
          href="/iten"
          className="text-lg font-bold text-cyan-200 hover:text-white hover:underline underline-offset-4"
        >
          View Saturday itinerary →
        </Link>
      </div>
    </div>
  );
}
