/**
 * Next.js Middleware for autentisering.
 * Redirecter uautentiserte brukere til innlogging for /admin-ruter.
 */

import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Kun beskytt /admin-ruter (unntatt innlogging og feil)
  if (
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/logginn") &&
    !pathname.startsWith("/admin/feil")
  ) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const url = new URL("/admin/logginn", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Beskytt /preview-ruter
  if (pathname.startsWith("/preview")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.redirect(new URL("/admin/logginn", request.url));
    }
  }

  // Beskytt /api/admin og /api/preview-ruter
  if (
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/preview-events")
  ) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/preview/:path*", "/api/admin/:path*", "/api/preview-events/:path*"],
};
