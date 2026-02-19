import { describe, it, expect } from "vitest";
import { formaterBelop } from "@/components/shared/NumberFormat";

describe("formaterBelop", () => {
  it("formaterer milliardbeløp korrekt", () => {
    expect(formaterBelop(2970883012000)).toBe("2970,9 mrd. kr");
  });

  it("formaterer millionbeløp korrekt", () => {
    expect(formaterBelop(413600000)).toBe("413,6 mill. kr");
  });

  it("formaterer beløp under million med mellomrom", () => {
    const resultat = formaterBelop(850000);
    // Bruker non-breaking space (\u00A0)
    expect(resultat).toBe("850\u00A0000 kr");
  });

  it("skjuler valuta når visValuta=false", () => {
    expect(formaterBelop(2970883012000, 1, false)).toBe("2970,9 mrd.");
  });

  it("viser fortegn for positive endringer", () => {
    const resultat = formaterBelop(5000000000, 1, true, true);
    expect(resultat).toBe("+5,0 mrd. kr");
  });

  it("viser minus for negative endringer", () => {
    const resultat = formaterBelop(-2000000000, 1, true, true);
    expect(resultat).toBe("−2,0 mrd. kr");
  });

  it("håndterer null-verdi", () => {
    expect(formaterBelop(0)).toBe("0 kr");
  });

  it("bruker korrekt presisjon", () => {
    expect(formaterBelop(2970883012000, 0)).toBe("2971 mrd. kr");
  });

  it("formaterer SPU-overføring korrekt", () => {
    expect(formaterBelop(413647646000)).toBe("413,6 mrd. kr");
  });

  it("formaterer netto oljepengebruk korrekt", () => {
    expect(formaterBelop(311221454000)).toBe("311,2 mrd. kr");
  });
});
