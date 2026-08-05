import Link from "next/link";
import { auth } from "@/auth";
import { signOutAction } from "@/app/actions/auth";
import { MobileNav, type NavItem } from "@/components/mobile-nav";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  const items: NavItem[] = [
    { href: "/", label: "Home" },
    { href: "/iten", label: "Saturday" },
  ];
  if (user?.isAdmin) {
    items.push({ href: "/admin", label: "Admin" });
  } else if (!user) {
    items.push({ href: "/signin", label: "Admin" });
  }

  return (
    <header className="border-b border-fuchsia-500/20 bg-black/60 backdrop-blur sticky top-0 z-20 shadow-[0_0_24px_rgba(176,38,255,0.15)]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="neon-title font-bold tracking-widest truncate"
        >
          BRANLYMPICS
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-4 text-sm">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="hover:text-fuchsia-300">
              {i.label}
            </Link>
          ))}
          {user?.isAdmin ? (
            <form action={signOutAction}>
              <button type="submit" className="hover:text-fuchsia-300">
                Sign out
              </button>
            </form>
          ) : null}
        </nav>

        {/* Mobile hamburger + drawer */}
        <MobileNav items={items} isSignedIn={Boolean(user?.isAdmin)} />
      </div>
    </header>
  );
}
