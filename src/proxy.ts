import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // DRF endpoints require trailing slashes. Preserve them so that Django's
  // APPEND_SLASH behavior cannot bounce against Next's canonical redirect.
  if (pathname === "/api/v1" || pathname.startsWith("/api/v1/")) {
    return NextResponse.next();
  }

  // Keep Next's prior canonical URL behavior for application pages.
  if (pathname.length > 1 && pathname.endsWith("/")) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(canonicalUrl, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
