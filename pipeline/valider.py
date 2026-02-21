"""
Steg 6: Validering av eksporterte JSON-filer.
Verifiserer totalsummer, hierarkinøkler og strukturell integritet.
"""

import json
from pathlib import Path

# Forventede totaler for 2025 (i kroner, med avrundingsmargin)
FORVENTEDE_TOTALER = {
    2025: {
        "utgifter_mrd": 2970.9,
        "inntekter_mrd": 2796.8,
        "oljekorrigert_utgifter_mrd": 2246.0,
        "oljekorrigert_inntekter_mrd": 1718.8,
        "margin_mrd": 0.5,
    }
}


def valider_json_filer(datamappe: Path, budsjettaar: int) -> list[str]:
    """Validerer alle JSON-filer i datamappen. Returnerer liste med feil."""
    feil = []

    # Sjekk at alle filer eksisterer
    forventede_filer = [
        "gul_bok_full.json",
        "gul_bok_aggregert.json",
        "gul_bok_endringer.json",
        "metadata.json",
    ]

    for filnavn in forventede_filer:
        filsti = datamappe / filnavn
        if not filsti.exists():
            feil.append(f"Mangler fil: {filsti}")

    if feil:
        return feil

    # Valider gul_bok_full.json
    with open(datamappe / "gul_bok_full.json", encoding="utf-8") as f:
        full_data = json.load(f)

    # Sjekk budsjettår
    if full_data.get("budsjettaar") != budsjettaar:
        feil.append(
            f"Feil budsjettår i gul_bok_full.json: "
            f"forventet {budsjettaar}, fikk {full_data.get('budsjettaar')}"
        )

    # Valider totaler mot kjente verdier
    if budsjettaar in FORVENTEDE_TOTALER:
        forventet = FORVENTEDE_TOTALER[budsjettaar]
        utgifter_mrd = full_data["utgifter"]["total"] / 1e9
        inntekter_mrd = full_data["inntekter"]["total"] / 1e9

        if abs(utgifter_mrd - forventet["utgifter_mrd"]) > forventet["margin_mrd"]:
            feil.append(
                f"Utgiftstotal avviker: {utgifter_mrd:.1f} mrd. kr "
                f"(forventet {forventet['utgifter_mrd']:.1f} mrd. kr)"
            )

        if abs(inntekter_mrd - forventet["inntekter_mrd"]) > forventet["margin_mrd"]:
            feil.append(
                f"Inntektstotal avviker: {inntekter_mrd:.1f} mrd. kr "
                f"(forventet {forventet['inntekter_mrd']:.1f} mrd. kr)"
            )

    # Valider hierarki-konsistens: sum av underliggende = total
    for side_navn in ["utgifter", "inntekter"]:
        side = full_data[side_navn]
        sum_omraader = sum(o["total"] for o in side["omraader"])
        if sum_omraader != side["total"]:
            feil.append(
                f"Inkonsistent total for {side_navn}: "
                f"sum omraader={sum_omraader}, total={side['total']}"
            )

        for omraade in side["omraader"]:
            sum_kat = sum(k["total"] for k in omraade["kategorier"])
            if sum_kat != omraade["total"]:
                feil.append(
                    f"Inkonsistent total for {side_navn} omr {omraade['omr_nr']}: "
                    f"sum kategorier={sum_kat}, total={omraade['total']}"
                )

            for kat in omraade["kategorier"]:
                sum_kap = sum(k["total"] for k in kat["kapitler"])
                if sum_kap != kat["total"]:
                    feil.append(
                        f"Inkonsistent total for kat {kat['kat_nr']}: "
                        f"sum kapitler={sum_kap}, total={kat['total']}"
                    )

                for kap in kat["kapitler"]:
                    sum_poster = sum(p["belop"] for p in kap["poster"])
                    if sum_poster != kap["total"]:
                        feil.append(
                            f"Inkonsistent total for kap {kap['kap_nr']}: "
                            f"sum poster={sum_poster}, total={kap['total']}"
                        )

    # Valider aggregert datasett
    # NB: Aggregert data EKSKLUDERER SPU (omr 34 fra utgifter, kap 5800 fra inntekter)
    # Så aggregert totaler er lavere enn full totaler. Vi sjekker bare intern konsistens.
    with open(datamappe / "gul_bok_aggregert.json", encoding="utf-8") as f:
        agg_data = json.load(f)

    sum_agg_utgifter = sum(k["belop"] for k in agg_data["utgifter_aggregert"])
    sum_agg_inntekter = sum(k["belop"] for k in agg_data["inntekter_aggregert"])

    # Sjekk at aggregert utgifter + SPU fondsuttak ≈ full total (evt. sjekk at de er positive)
    if sum_agg_utgifter <= 0:
        feil.append(f"Aggregert utgiftstotal er 0 eller negativ: {sum_agg_utgifter}")

    if sum_agg_inntekter <= 0:
        feil.append(f"Aggregert inntektstotal er 0 eller negativ: {sum_agg_inntekter}")

    # Sjekk at fondsuttak er positiv
    fondsuttak = agg_data.get("spu", {}).get("fondsuttak", 0)
    if fondsuttak <= 0:
        feil.append(f"Fondsuttak er 0 eller negativt: {fondsuttak}")

    # Sjekk at barene balanserer: utgifter_ord = inntekter_ord + fondsuttak
    if abs(sum_agg_utgifter - sum_agg_inntekter - fondsuttak) > 1000:
        feil.append(
            f"Barer balanserer ikke: utg={sum_agg_utgifter}, "
            f"inn={sum_agg_inntekter}, fond={fondsuttak}, "
            f"diff={sum_agg_utgifter - sum_agg_inntekter - fondsuttak}"
        )

    # Sjekk at total_utgifter i aggregert JSON == sum(utgifter_aggregert)
    if "total_utgifter" in agg_data:
        if abs(agg_data["total_utgifter"] - sum_agg_utgifter) > 1000:
            feil.append(
                f"total_utgifter i aggregert != sum(utgifter_aggregert): "
                f"{agg_data['total_utgifter']} != {sum_agg_utgifter}"
            )

    # Valider oljekorrigert seksjon i full JSON
    if "oljekorrigert" not in full_data:
        feil.append("Mangler 'oljekorrigert' seksjon i gul_bok_full.json")
    else:
        ok = full_data["oljekorrigert"]
        if abs(ok["utgifter_total"] - sum_agg_utgifter) > 1000:
            feil.append(
                f"oljekorrigert.utgifter_total != sum(utgifter_aggregert): "
                f"{ok['utgifter_total']} != {sum_agg_utgifter}"
            )

    # Valider oljekorrigerte totaler mot kjente verdier
    if budsjettaar in FORVENTEDE_TOTALER:
        forventet = FORVENTEDE_TOTALER[budsjettaar]
        if "oljekorrigert_utgifter_mrd" in forventet:
            ok_utg_mrd = sum_agg_utgifter / 1e9
            if abs(ok_utg_mrd - forventet["oljekorrigert_utgifter_mrd"]) > forventet["margin_mrd"]:
                feil.append(
                    f"Oljekorrigert utgifter avviker: {ok_utg_mrd:.1f} mrd. kr "
                    f"(forventet {forventet['oljekorrigert_utgifter_mrd']:.1f} mrd. kr)"
                )

    # Sjekk at netto_overfoering_til_spu finnes og er korrekt
    spu_data = agg_data.get("spu", {})
    if "netto_overfoering_til_spu" not in spu_data:
        feil.append("Mangler 'netto_overfoering_til_spu' i spu-data")
    else:
        forventet_netto = spu_data.get("netto_kontantstrom", 0) - fondsuttak
        if abs(spu_data["netto_overfoering_til_spu"] - forventet_netto) > 1000:
            feil.append(
                f"netto_overfoering_til_spu feil: "
                f"{spu_data['netto_overfoering_til_spu']} != "
                f"kontantstrom({spu_data.get('netto_kontantstrom', 0)}) - fondsuttak({fondsuttak})"
            )

    # Sjekk filstørrelse for aggregert (bør være < 50 KB)
    agg_filstr = (datamappe / "gul_bok_aggregert.json").stat().st_size
    if agg_filstr > 50 * 1024:
        feil.append(
            f"gul_bok_aggregert.json er for stor: {agg_filstr / 1024:.1f} KB (maks 50 KB)"
        )

    return feil


if __name__ == "__main__":
    import sys

    datamappe = Path(__file__).parent.parent / "data" / "2025"
    feil = valider_json_filer(datamappe, 2025)

    if feil:
        print("VALIDERINGSFEIL:")
        for f in feil:
            print(f"  ✗ {f}")
        sys.exit(1)
    else:
        print("✓ Alle valideringer bestått.")
