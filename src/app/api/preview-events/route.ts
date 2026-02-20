/**
 * Server-Sent Events (SSE) endepunkt for sanntids forhåndsvisning.
 * Sender refresh-hendelser til forhåndsvisnings-iFrame.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Enkel in-memory event-bus for preview-refresh
const lyttere = new Set<(data: string) => void>();

export function sendPreviewRefresh(aarstall: number) {
  const melding = JSON.stringify({ type: "refresh", aarstall });
  for (const lytter of lyttere) {
    lytter(melding);
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Ikke autentisert", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      // Registrer lytter
      lyttere.add(send);

      // Keepalive-ping hvert 30. sekund
      const interval = setInterval(() => {
        controller.enqueue(encoder.encode(`data: ping\n\n`));
      }, 30000);

      // Rydd opp når klienten kobler fra
      const cleanup = () => {
        clearInterval(interval);
        lyttere.delete(send);
      };

      // ReadableStream har ikke direkte abort-støtte her,
      // men controlleren vil feile ved skriving til lukket stream
      void controller.desiredSize; // Hold referanse

      // Fallback timeout for opprydding
      setTimeout(() => {
        cleanup();
        try {
          controller.close();
        } catch {
          // Allerede lukket
        }
      }, 10 * 60 * 1000); // 10 minutter maks sesjon
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
