/**
 * NextAuth API-rute.
 * Håndterer innlogging, utlogging og sesjonshåndtering.
 *
 * Denne filen pakker NextAuth-handleren slik at vi kan fange
 * forespørsler til `/api/auth/error` og sanitere `error`-parameteren
 * før videre behandling / redirect. Dette forhindrer at lange
 * eller ikke-ASCII tegn i stacktraces (f.eks. →) forårsaker
 * ByteString-konverteringsfeil når verdien sendes i URL.
 */

import { NextResponse } from "next/server";
import { GET as nextAuthGET, POST as nextAuthPOST } from "@/lib/auth";

function sanitizeErrorValue(value: string | null): string | null {
  if (!value) return null;
  // Fjern ikke-ASCII-tegn og trim lengde for sikker URL-bruk
  const asciiOnly = value.replace(/[^\x00-\x7F]/g, "?");
  return asciiOnly.length > 300 ? asciiOnly.slice(0, 300) + "..." : asciiOnly;
}

export async function GET(
  request: Request,
  { params }: { params: { nextauth: string[] } },
) {
  const url = new URL(request.url);

  if (url.pathname.endsWith("/error")) {
    const raw = url.searchParams.get("error");
    const sanitized = sanitizeErrorValue(raw);
    const accept = request.headers.get("accept") || "";

    // If the client expects JSON (fetch from client-side), return a JSON
    // payload so the NextAuth client can parse it. For browser navigations,
    // perform a redirect to the human-facing error page.
    if (accept.includes("application/json") || accept.includes("*/*")) {
      return NextResponse.json({ error: sanitized });
    }

    const redirectTo = new URL("/admin/feil", url.origin);
    if (sanitized) redirectTo.searchParams.set("error", sanitized);
    return NextResponse.redirect(redirectTo);
  }

  // Forward to NextAuth GET handler, passing params so it can read route segments
  return await nextAuthGET(request as any, { params } as any);
}

export async function POST(
  request: Request,
  { params }: { params: { nextauth: string[] } },
) {
  // Forward to NextAuth POST handler, passing params for route segment access
  return await nextAuthPOST(request as any, { params } as any);
}
