/**
 * Klient-komponent for SSE-lytting i forhåndsvisning.
 * Kjører router.refresh() når admin-panelet sender en oppdatering.
 */

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function PreviewClient() {
  const router = useRouter();

  useEffect(() => {
    const eventSource = new EventSource("/api/preview-events");

    eventSource.onmessage = (event) => {
      if (event.data === "ping") return;

      try {
        const data = JSON.parse(event.data);
        if (data.type === "refresh") {
          router.refresh();
        }
      } catch {
        // Ignorer ugyldig JSON
      }
    };

    eventSource.onerror = () => {
      // Kobler automatisk til på nytt
    };

    return () => {
      eventSource.close();
    };
  }, [router]);

  return null;
}
