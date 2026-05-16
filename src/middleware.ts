import { NextResponse, type NextRequest } from "next/server";

// Edge-safe middleware: redirects www→apex and gates routes behind a session
// cookie (presence check only — full token validation happens in server
// components/actions which run in the Node runtime).

const CANONICAL_HOST = "branlympics.com";
const REDIRECT_HOSTS = new Set([
  "www.branlympics.com",
  "green-desert-05a823d0f.7.azurestaticapps.net",
]);

// Auth.js v5 stores its JWT under these cookie names depending on protocol.
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

const PUBLIC_PATHS = new Set(["/", "/signin", "/signup"]);
const PUBLIC_PREFIXES = ["/api/auth/"];

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase() ?? "";
  if (REDIRECT_HOSTS.has(host)) {
    const url = new URL(request.url);
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  const { pathname, search } = request.nextUrl;
  const isPublic =
    PUBLIC_PATHS.has(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isPublic) {
    const hasSession = SESSION_COOKIES.some(
      (name) => request.cookies.get(name)?.value,
    );
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      url.search = `?callbackUrl=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|images/).*)"],
};
