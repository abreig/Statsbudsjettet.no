/**
 * POST-endepunkt for å trigge en forhåndsvisnings-refresh.
 * Kalles fra admin-panelet etter lagring.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendPreviewRefresh } from "../route";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Ikke autentisert", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const aarstall = parseInt(searchParams.get("aarstall") ?? "2025");

  sendPreviewRefresh(aarstall);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
