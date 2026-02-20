/**
 * Aktiverer Next.js Draft Mode for forhåndsvisning.
 * Autentisert endepunkt som setter en signert cookie.
 */

import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Ikke autentisert", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const aarstall = searchParams.get("aarstall") ?? "2025";

  (await draftMode()).enable();
  redirect(`/preview/${aarstall}`);
}
