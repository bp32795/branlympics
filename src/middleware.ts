import { NextResponse, type NextRequest } from "next/server";

// Redirect www.branlympics.com and the default *.azurestaticapps.net hostname
// to the canonical apex domain.
const CANONICAL_HOST = "branlympics.com";
const REDIRECT_HOSTS = new Set([
  "www.branlympics.com",
  "green-desert-05a823d0f.7.azurestaticapps.net",
]);

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase() ?? "";
  if (REDIRECT_HOSTS.has(host)) {
    const url = new URL(request.url);
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  // Skip static assets and Next internals; redirect everything else.
  matcher: ["/((?!_next/|favicon.ico|images/).*)"],
};
