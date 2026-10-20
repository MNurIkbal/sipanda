import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Nama cookie untuk menyimpan sesi akses selama 2 hari
const ACCESS_COOKIE_NAME = "sipanda_access_gate";
const COOKIE_MAX_AGE = 2 * 24 * 60 * 60; // 2 hari (dalam detik)

// Token rahasia khusus (bisa diatur lewat process.env.APP_ACCESS_TOKEN)
const REQUIRED_ACCESS_TOKEN = (process.env.APP_ACCESS_TOKEN || "k9X#mQ2$vL").trim();

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname === "/blocked" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const tokenParam = searchParams.get("access_token");
  const decodedTokenParam = tokenParam ? decodeURIComponent(tokenParam).trim() : null;

  const isValidToken = Boolean(
    decodedTokenParam && (decodedTokenParam === REQUIRED_ACCESS_TOKEN || tokenParam?.trim() === REQUIRED_ACCESS_TOKEN)
  );

  if (isValidToken) {
    const cleanToken = tokenParam!.trim();

    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete("access_token");

    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set({
      name: ACCESS_COOKIE_NAME,
      value: cleanToken,
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
    });

    return response;
  }

  const activeCookie = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const hasValidCookieSession = Boolean(
    activeCookie && activeCookie.trim() === REQUIRED_ACCESS_TOKEN
  );

  if (hasValidCookieSession) {
    return NextResponse.next();
  }

  const blockedUrl = new URL("/blocked", request.url);
  return NextResponse.redirect(blockedUrl);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
