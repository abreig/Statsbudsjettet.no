"""
Steg 3: Hierarkisk aggregering.
Bygger trestruktur fra bunn (poster) og opp (kapitler → kategorier → områder → side).
Inkluderer postgruppe-klassifisering og stikkord-parsing.
"""

import pandas as pd


def klassifiser_postgruppe(post_nr: int) -> str:
    """Klassifiserer en post i postgruppe basert på postnummer."""
    if 1 <= post_nr <= 29:
        return "driftsutgifter"
    elif 30 <= post_nr <= 49:
        return "investeringer"
    elif 50 <= post_nr <= 69:
        return "overforinger_statsregnskaper"
    elif 70 <= post_nr <= 89:
        return "overforinger_private"
    elif 90 <= post_nr <= 99:
        return "utlaan_statsgjeld"
    else:
        return "driftsutgifter"


def parse_stikkord(stikkord_str: str) -> list[str]:
    """Parser stikkord-strengen til en liste."""
    if not stikkord_str or pd.isna(stikkord_str):
        return []
    return [s.strip() for s in stikkord_str.split(",") if s.strip()]


def bygg_hierarki_for_side(df: pd.DataFrame) -> dict:
    """Bygger hierarkisk trestruktur for en side (utgift eller inntekt)."""
    omraader = []

    for (omr_nr, omr_navn), omr_df in df.groupby(["omr_nr", "omr_navn"]):
        kategorier = []

        for (kat_nr, kat_navn), kat_df in omr_df.groupby(["kat_nr", "kat_navn"]):
            kapitler = []

            for (kap_nr, kap_navn), kap_df in kat_df.groupby(["kap_nr", "kap_navn"]):
                poster = []

                for _, rad in kap_df.iterrows():
                    poster.append({
                        "post_nr": int(rad["post_nr"]),
                        "upost_nr": int(rad["upost_nr"]),
                        "navn": rad["post_navn"],
                        "belop": int(rad["GB"]),
                        "postgruppe": klassifiser_postgruppe(int(rad["post_nr"])),
                        "stikkord": parse_stikkord(rad["stikkord"]),
                        "endring_fra_saldert": None,
                    })

                kapitler.append({
                    "kap_nr": int(kap_nr),
                    "navn": kap_navn,
                    "total": sum(p["belop"] for p in poster),
                    "poster": poster,
                })

            kategorier.append({
                "kat_nr": int(kat_nr),
                "navn": kat_navn,
                "total": sum(k["total"] for k in kapitler),
                "kapitler": kapitler,
            })

        omraader.append({
            "omr_nr": int(omr_nr),
            "navn": omr_navn,
            "total": sum(k["total"] for k in kategorier),
            "kategorier": kategorier,
        })

    return {
        "total": sum(o["total"] for o in omraader),
        "omraader": omraader,
    }


def bygg_komplett_hierarki(df: pd.DataFrame) -> dict:
    """Bygger komplett hierarki med utgifts- og inntektssider."""
    utgifter = bygg_hierarki_for_side(df[df["side"] == "utgift"])
    inntekter = bygg_hierarki_for_side(df[df["side"] == "inntekt"])

    return {
        "utgifter": utgifter,
        "inntekter": inntekter,
    }


if __name__ == "__main__":
    from pathlib import Path
    from les_gul_bok import les_gul_bok

    rotmappe = Path(__file__).parent.parent
    df = les_gul_bok(rotmappe / "Gul bok 2025.xlsx")
    hierarki = bygg_komplett_hierarki(df)

    print(f"Utgifter: {hierarki['utgifter']['total'] / 1e9:.1f} mrd. kr")
    print(f"  Antall programområder: {len(hierarki['utgifter']['omraader'])}")
    print(f"Inntekter: {hierarki['inntekter']['total'] / 1e9:.1f} mrd. kr")
    print(f"  Antall programområder: {len(hierarki['inntekter']['omraader'])}")

    # Vis de 5 største utgiftsområdene
    omr_sortert = sorted(hierarki["utgifter"]["omraader"], key=lambda o: o["total"], reverse=True)
    print("\nStørste utgiftsområder:")
    for o in omr_sortert[:5]:
        print(f"  {o['navn']}: {o['total'] / 1e9:.1f} mrd. kr")
