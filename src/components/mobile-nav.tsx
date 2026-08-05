"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { signOutAction } from "@/app/actions/auth";

export interface NavItem {
  href: string;
  label: string;
}

const subscribeToClient = () => () => {};

export function MobileNav({
  items,
  isSignedIn,
}: {
  items: NavItem[];
  isSignedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const mounted = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false,
  );

  // Lock body scroll while drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="sm:hidden inline-flex items-center justify-center h-10 w-10 -mr-2 rounded-md text-fuchsia-200 hover:text-fuchsia-100 hover:bg-fuchsia-500/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {mounted && createPortal(
        <div className="sm:hidden">
            {/* Backdrop */}
            <div
              onClick={() => setOpen(false)}
              aria-hidden="true"
              className={`fixed inset-0 z-[60] bg-black/70 transition-opacity duration-200 ${
                open ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            />

            {/* Drawer */}
            <aside
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              className={`fixed top-0 left-0 z-[70] isolate h-full w-72 max-w-[85vw] border-r border-fuchsia-500/40 bg-[#0a0014] shadow-[0_0_40px_rgba(176,38,255,0.35)] transform transition-transform duration-200 ease-out ${
                open ? "translate-x-0" : "-translate-x-full"
              }`}
              style={{ background: "#0a0014", opacity: 1 }}
            >
              <div className="h-14 px-4 flex items-center justify-between border-b border-fuchsia-500/20">
                <span className="neon-title font-bold tracking-widest text-sm">
                  BRANLYMPICS
                </span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-md text-zinc-300 hover:text-fuchsia-200 hover:bg-fuchsia-500/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="18" y1="6" x2="6" y2="18" />
                  </svg>
                </button>
              </div>
              <nav className="p-2 flex flex-col">
                {items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/" && pathname?.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`px-3 py-3 rounded-md text-base ${
                        active
                          ? "text-fuchsia-200 bg-fuchsia-500/10"
                          : "text-zinc-200 hover:text-fuchsia-200 hover:bg-fuchsia-500/10"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                {isSignedIn && (
                  <div className="mt-2 pt-2 border-t border-zinc-800">
                    <form action={signOutAction}>
                      <button
                        type="submit"
                        className="w-full text-left px-3 py-3 rounded-md text-base text-zinc-200 hover:text-fuchsia-200 hover:bg-fuchsia-500/10"
                      >
                        Sign out
                      </button>
                    </form>
                  </div>
                )}
              </nav>
            </aside>
        </div>,
        document.body,
      )}
    </>
  );
}
