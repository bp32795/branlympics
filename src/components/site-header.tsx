import Link from "next/link";
import { auth } from "@/auth";
import { signOutAction } from "@/app/actions/auth";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;
  return (
    <header className="border-b border-fuchsia-500/20 bg-black/60 backdrop-blur sticky top-0 z-20 shadow-[0_0_24px_rgba(176,38,255,0.15)]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="neon-title font-bold tracking-widest">
          BRANLYMPICS
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/games" className="hover:text-fuchsia-300">Games</Link>
          {user && (
            <Link href="/account" className="hover:text-fuchsia-300">My signups</Link>
          )}
          {user?.isAdmin && (
            <Link href="/admin/games" className="hover:text-fuchsia-300">Admin</Link>
          )}
          {user ? (
            <form action={signOutAction}>
              <button type="submit" className="hover:text-fuchsia-300">
                Sign out
              </button>
            </form>
          ) : (
            <Link href="/signin" className="hover:text-fuchsia-300">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
