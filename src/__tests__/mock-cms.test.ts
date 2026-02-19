import { describe, it, expect } from "vitest";
import { hentMockCMSData } from "@/lib/mock-cms";

describe("hentMockCMSData", () => {
  it("returnerer data for 2025", () => {
    const data = hentMockCMSData(2025);
    expect(data).not.toBeNull();
    expect(data?.aar).toBe(2025);
  });

  it("returnerer null for ukjent år", () => {
    expect(hentMockCMSData(2000)).toBeNull();
  });

  it("har godkjent status for 2025", () => {
    const data = hentMockCMSData(2025);
    expect(data?.status).toBe("approved");
  });

  it("har fire moduler", () => {
    const data = hentMockCMSData(2025);
    expect(data?.moduler).toHaveLength(4);
  });

  it("har moduler i riktig rekkefølge", () => {
    const data = hentMockCMSData(2025);
    const typer = data?.moduler.map((m) => m.type);
    expect(typer).toEqual(["hero", "plan_for_norge", "budsjettgrafer", "nokkeltall"]);
  });

  it("alle moduler er synlige", () => {
    const data = hentMockCMSData(2025);
    expect(data?.moduler.every((m) => m.synlig)).toBe(true);
  });

  it("har fem temaer", () => {
    const data = hentMockCMSData(2025);
    expect(data?.temaer).toHaveLength(5);
  });

  it("hvert tema har påkrevde felt", () => {
    const data = hentMockCMSData(2025);
    data?.temaer.forEach((tema) => {
      expect(tema.nr).toBeGreaterThan(0);
      expect(tema.tittel).toBeTruthy();
      expect(tema.ingress).toBeTruthy();
      expect(tema.farge).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(tema.problembeskrivelse).toBeTruthy();
      expect(tema.prioriteringer.length).toBeGreaterThan(0);
    });
  });

  it("tema 5 har sitat", () => {
    const data = hentMockCMSData(2025);
    const tema5 = data?.temaer.find((t) => t.nr === 5);
    expect(tema5?.sitat).toBeDefined();
    expect(tema5?.sitat?.person).toBe("Jonas Gahr Støre");
  });

  it("hero-modul har nøkkeltall med datareferanser", () => {
    const data = hentMockCMSData(2025);
    const heroModul = data?.moduler.find((m) => m.type === "hero");
    const nokkeltall = heroModul?.konfigurasjon.nokkeltall as { datareferanse: string }[];
    expect(nokkeltall).toHaveLength(3);
    expect(nokkeltall[0].datareferanse).toBe("utgifter.total");
  });
});
