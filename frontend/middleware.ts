import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Nama cookie untuk menyimpan sesi akses selama 2 hari
const ACCESS_COOKIE_NAME = "sipanda_access_gate";
const COOKIE_MAX_AGE = 2 * 24 * 60 * 60; // 2 hari (dalam detik)

// Token rahasia khusus 10 digit acak (bisa diatur lewat process.env.APP_ACCESS_TOKEN)
const REQUIRED_ACCESS_TOKEN = process.env.APP_ACCESS_TOKEN || "k9X#mQ2$vL";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Abaikan file statis, aset Next.js, API, dan halaman blocked agar tidak loop
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname === "/blocked" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Cek apakah ada query parameter ?access_token=...
  const tokenParam = searchParams.get("access_token");

  // Validasi token rahasia 10 karakter acak
  const isValidToken = Boolean(
    tokenParam && tokenParam.trim() === REQUIRED_ACCESS_TOKEN
  );

  // 3. Jika membawa token rahasia yang valid:
  if (isValidToken) {
    const cleanToken = tokenParam!.trim();

    // Buat URL baru tanpa parameter ?access_token= agar URL bersih
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete("access_token");

    // Redirect ke URL yang sudah bersih dan set Cookie selama 7 hari
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

  // 4. Cek apakah pengguna sudah memiliki cookie yang masih aktif (berlaku 7 hari)
  const activeCookie = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const hasValidCookieSession = Boolean(
    activeCookie && activeCookie.trim() === REQUIRED_ACCESS_TOKEN
  );

  if (hasValidCookieSession) {
    // Pengguna sudah lolos validasi dan sesi cookie masih berlaku
    return NextResponse.next();
  }

  // 5. Jika tidak ada cookie valid dan tidak menyertakan ?access_token= 10 digit, blokir akses
  const blockedUrl = new URL("/blocked", request.url);
  return NextResponse.redirect(blockedUrl);
}

// Konfigurasi matcher: mencakup semua rute kecuali file internal Next.js
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
