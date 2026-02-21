import { describe, it, expect } from "vitest";
import { opplosDatareferanse, formaterDatareferanse } from "@/lib/datareferanse";
import type { BudgetYear } from "@/components/data/types/budget";

const mockData: BudgetYear = {
  budsjettaar: 2025,
  publisert: "2026-02-19",
  valuta: "NOK",
  utgifter: {
    total: 2970883012000,
    omraader: [
      {
        omr_nr: 4,
        navn: "Forsvar",
        total: 110069526000,
        kategorier: [],
      },
      {
        omr_nr: 10,
        navn: "Helse og omsorg",
        total: 248109015000,
        kategorier: [],
      },
    ],
  },
  inntekter: {
    total: 2796781829000,
    omraader: [],
  },
  spu: {
    overfoering_til_fond: 642769100000,
    finansposter_til_fond: 82100000000,
    overfoering_fra_fond: 413647646000,
    netto_overfoering: 311221454000,
    fondsuttak: 413647646000,
    netto_kontantstrom: 724869100000,
    netto_overfoering_til_spu: 311221454000,
    kontantstrom_kilder: [],
  },
  oljekorrigert: {
    utgifter_total: 1991246612000,
    inntekter_total: 1577598966000,
  },
  metadata: {
    kilde: "Gul bok 2025",
    saldert_budsjett_forrige: "2024",
  },
};

describe("opplosDatareferanse", () => {
  it("oppløser enkel feltsti", () => {
    expect(opplosDatareferanse("utgifter.total", mockData)).toBe(2970883012000);
  });

  it("oppløser SPU-referanse", () => {
    expect(opplosDatareferanse("spu.overfoering_fra_fond", mockData)).toBe(413647646000);
  });

  it("oppløser fondsuttak (oljekorrigert underskudd)", () => {
    expect(opplosDatareferanse("spu.fondsuttak", mockData)).toBe(413647646000);
  });

  it("oppløser nøstet feltsti med arrayfilter", () => {
    expect(
      opplosDatareferanse("utgifter.omraader[omr_nr=4].total", mockData)
    ).toBe(110069526000);
  });

  it("oppløser annet programområde", () => {
    expect(
      opplosDatareferanse("utgifter.omraader[omr_nr=10].total", mockData)
    ).toBe(248109015000);
  });

  it("returnerer null for ukjent felt", () => {
    expect(opplosDatareferanse("ukjent.felt", mockData)).toBeNull();
  });

  it("returnerer null for ukjent omr_nr", () => {
    expect(
      opplosDatareferanse("utgifter.omraader[omr_nr=99].total", mockData)
    ).toBeNull();
  });

  it("returnerer null for tom referanse", () => {
    expect(opplosDatareferanse("", mockData)).toBeNull();
  });

  it("oppløser oljekorrigert utgifter", () => {
    expect(opplosDatareferanse("oljekorrigert.utgifter_total", mockData)).toBe(1991246612000);
  });

  it("oppløser oljekorrigert inntekter", () => {
    expect(opplosDatareferanse("oljekorrigert.inntekter_total", mockData)).toBe(1577598966000);
  });

  it("oppløser netto overføring til SPU", () => {
    expect(opplosDatareferanse("spu.netto_overfoering_til_spu", mockData)).toBe(311221454000);
  });
});

describe("formaterDatareferanse", () => {
  it("formaterer milliardbeløp", () => {
    expect(formaterDatareferanse("utgifter.total", mockData)).toBe("2970,9 mrd. kr");
  });

  it("formaterer SPU-beløp", () => {
    expect(formaterDatareferanse("spu.overfoering_fra_fond", mockData)).toBe("413,6 mrd. kr");
  });

  it("returnerer null for ukjent referanse", () => {
    expect(formaterDatareferanse("ukjent", mockData)).toBeNull();
  });
});
