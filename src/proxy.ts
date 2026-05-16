import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Redirect www.branlympics.com and the default *.azurestaticapps.net hostname
// to the canonical apex domain.
const CANONICAL_HOST = "branlympics.com";
const REDIRECT_HOSTS = new Set([
  "www.branlympics.com",
  "green-desert-05a823d0f.7.azurestaticapps.net",
]);

// Paths reachable without being signed in. Everything else requires auth.
const PUBLIC_PATHS = new Set(["/", "/signin", "/signup"]);
const PUBLIC_PREFIXES = ["/api/auth/"];

export default auth((request) => {
  const host = request.headers.get("host")?.toLowerCase() ?? "";
  if (REDIRECT_HOSTS.has(host)) {
    const url = new URL(request.url);
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  const { pathname } = request.nextUrl;
  const isPublic =
    PUBLIC_PATHS.has(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isPublic && !request.auth) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.search = `?callbackUrl=${encodeURIComponent(
      pathname + request.nextUrl.search,
    )}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  // Skip static assets and Next internals; gate everything else.
  matcher: ["/((?!_next/|favicon.ico|images/).*)"],
};
