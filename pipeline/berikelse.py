"""
Steg 4: Berikelse — SPU-beregninger og aggregert datasett.
Isolerer SPU-poster, beregner netto overføring, og genererer
det aggregerte datasettet for landingssiden.

Oljekorrigert logikk (se OLJEKORRIGERT.md):
- Filtrerer bort finanstransaksjoner (post >= 90)
- Utgifter ekskluderer kap 2800 (SPU) og kap 2440 (SDØE)
- Inntekter ekskluderer kap 5800, 5507, 5508, 5509, 5440, 5685
- Fondsuttaket = oljekorrigert underskudd = utgifter_uten_olje - inntekter_uten_olje
- Monokromatiske fargeskalaer (marine for utgifter, teal for inntekter)
"""

import pandas as pd

# Monokromatisk marine-skala for utgifter
# Sortert mørkest → lysest (tildeles etter beløpsstørrelse)
UTGIFT_FARGESKALA = [
    "#0C1045", "#181C62", "#263080", "#354A9E",
    "#4A65B5", "#6580C5", "#839DD5", "#A8BAE2",
]

# Monokromatisk teal-skala for inntekter
INNTEKT_FARGESKALA = [
    "#004D52", "#006B73", "#008286", "#2A9D8F", "#5AB8AD",
]

# SPU-sone-farger
SPU_BLA = "#2C4F8A"

# Folketrygdens programområder
FOLKETRYGD_OMRAADER = {28, 29, 30, 33}

# Petroleumskapitler som ekskluderes fra oljekorrigert budsjett
# Se OLJEKORRIGERT.md for begrunnelse
PETRO_KAP_UTGIFT = {2800, 2440}
PETRO_KAP_INNTEKT = {5800, 5507, 5508, 5509, 5440, 5685}

# Manuelt innlagte tall som ikke kan beregnes fra Gul bok.
# Strukturelt oljekorrigert underskudd og uttaksprosent publiseres i
# Nasjonalbudsjettet, ikke i Gul bok. Se OLJEKORRIGERT.md.
MANUELLE_TALL: dict[int, dict] = {
    2026: {
        "strukturelt_underskudd": 579_400_000_000,
        "uttaksprosent": 3.1,
    },
}


def beregn_spu(df: pd.DataFrame) -> dict:
    """Isolerer SPU-poster og beregner nøkkeltall inkl. kontantstrøm-kilder."""
    utgifter = df[df["side"] == "utgift"]
    inntekter = df[df["side"] == "inntekt"]

    # Kap. 2800 post 50: Overføring til fondet
    overfoering_til = df[
        (df["kap_nr"] == 2800) & (df["post_nr"] == 50)
    ]["GB"].sum()

    # Kap. 2800 post 96: Finansposter til fondet
    finansposter = df[
        (df["kap_nr"] == 2800) & (df["post_nr"] == 96)
    ]["GB"].sum()

    # Kap. 5800 post 50: Overføring fra fondet
    overfoering_fra = df[
        (df["kap_nr"] == 5800) & (df["post_nr"] == 50)
    ]["GB"].sum()

    netto = int(overfoering_til) + int(finansposter) - int(overfoering_fra)

    # Fondsuttak beregnes i kjor_pipeline.py som balanseringspost
    # (oljekorrigert underskudd = utgifter_agg - inntekter_agg)
    fondsuttak = 0

    # Kontantstrøm-kilder (petroleumsinntekter)
    # Petroleumsskatter: kap 5507 + 5508 (CO₂) + 5509 (NOx)
    petskatt = int(inntekter[inntekter["kap_nr"].isin({5507, 5508, 5509})]["GB"].sum())

    # SDFI (kap 5440)
    sdfi = int(inntekter[inntekter["kap_nr"] == 5440]["GB"].sum())

    # Equinor-utbytte (kap 5685)
    equinor = int(inntekter[inntekter["kap_nr"] == 5685]["GB"].sum())

    # Netto kontantstrøm = summen av petroleumsinntekter
    kontantstrom_kilder = [
        {"id": "petskatt", "navn": "Petroleumsskatter", "belop": petskatt},
        {"id": "sdfi", "navn": "SDFI", "belop": sdfi},
    ]
    if equinor > 0:
        kontantstrom_kilder.append(
            {"id": "equinor", "navn": "Equinor-utbytte", "belop": equinor}
        )

    netto_kontantstrom = sum(k["belop"] for k in kontantstrom_kilder)

    # Andre petroleumsinntekter (kap 5800/2800-relaterte poster som ikke er dekket)
    # Bruker den bokførte overføring til fond som proxy for total kontantstrøm
    andre_petro = int(overfoering_til) + int(finansposter) - netto_kontantstrom
    if andre_petro > 0:
        kontantstrom_kilder.append(
            {"id": "andre_petro", "navn": "Andre petroleumsinnt.", "belop": andre_petro}
        )
        netto_kontantstrom += andre_petro

    return {
        "overfoering_til_fond": int(overfoering_til),
        "finansposter_til_fond": int(finansposter),
        "overfoering_fra_fond": int(overfoering_fra),
        "netto_overfoering": netto,
        "fondsuttak": fondsuttak,
        "netto_kontantstrom": netto_kontantstrom,
        "kontantstrom_kilder": kontantstrom_kilder,
    }


def generer_aggregert_utgifter(df: pd.DataFrame) -> list[dict]:
    """Genererer aggregert utgiftskategorier for stacked barplot.
    Filtrerer «uten olje og gass»: post < 90, ekskl. kap 2800/2440.
    Se OLJEKORRIGERT.md for fullstendig begrunnelse."""
    utgifter = df[
        (df["side"] == "utgift") &
        (df["post_nr"] < 90) &
        (~df["kap_nr"].isin(PETRO_KAP_UTGIFT))
    ]

    # Folketrygden (omr 28, 29, 30, 33)
    folketrygd_belop = int(
        utgifter[utgifter["omr_nr"].isin(FOLKETRYGD_OMRAADER)]["GB"].sum()
    )

    # Kommuner og distrikter (omr 13)
    kommuner_belop = int(
        utgifter[utgifter["omr_nr"] == 13]["GB"].sum()
    )

    # Helse og omsorg (omr 10)
    helse_belop = int(
        utgifter[utgifter["omr_nr"] == 10]["GB"].sum()
    )

    # Kunnskapsformål (omr 7)
    kunnskap_belop = int(
        utgifter[utgifter["omr_nr"] == 7]["GB"].sum()
    )

    # Næring og fiskeri (omr 17)
    naering_belop = int(
        utgifter[utgifter["omr_nr"] == 17]["GB"].sum()
    )

    # Forsvar (omr 4)
    forsvar_belop = int(
        utgifter[utgifter["omr_nr"] == 4]["GB"].sum()
    )

    # Transport (omr 21)
    transport_belop = int(
        utgifter[utgifter["omr_nr"] == 21]["GB"].sum()
    )

    # Øvrige utgifter (resten — omr 34 er tom etter kap 2800-ekskludering)
    kjente_omraader = FOLKETRYGD_OMRAADER | {34, 13, 10, 7, 17, 4, 21}
    ovrige_belop = int(
        utgifter[~utgifter["omr_nr"].isin(kjente_omraader)]["GB"].sum()
    )

    # Beregn omr_gruppe for "Øvrige utgifter" dynamisk
    ovrige_omr = sorted(
        utgifter[~utgifter["omr_nr"].isin(kjente_omraader)]["omr_nr"].unique().tolist()
    )

    kategorier = [
        {"id": "folketrygden", "navn": "Folketrygden", "belop": folketrygd_belop, "omr_gruppe": [28, 29, 30, 33]},
        {"id": "kommuner", "navn": "Kommuner og distrikter", "belop": kommuner_belop, "omr_nr": 13},
        {"id": "helse", "navn": "Helse og omsorg", "belop": helse_belop, "omr_nr": 10},
        {"id": "kunnskap", "navn": "Kunnskapsformål", "belop": kunnskap_belop, "omr_nr": 7},
        {"id": "naering", "navn": "Næring og fiskeri", "belop": naering_belop, "omr_nr": 17},
        {"id": "forsvar", "navn": "Forsvar", "belop": forsvar_belop, "omr_nr": 4},
        {"id": "transport", "navn": "Innenlands transport", "belop": transport_belop, "omr_nr": 21},
        {"id": "ovrige_utgifter", "navn": "Øvrige utgifter", "belop": ovrige_belop, "omr_gruppe": ovrige_omr},
    ]

    # Sorter fra størst til minst, tildel farge fra monokromatisk skala
    kategorier.sort(key=lambda x: x["belop"], reverse=True)
    for i, kat in enumerate(kategorier):
        kat["farge"] = UTGIFT_FARGESKALA[i] if i < len(UTGIFT_FARGESKALA) else UTGIFT_FARGESKALA[-1]

    return kategorier


def generer_aggregert_inntekter(df: pd.DataFrame) -> list[dict]:
    """Genererer aggregert inntektskategorier for stacked barplot.
    Filtrerer «uten olje og gass»: post < 90, ekskl. petroleumskapitler.
    Se OLJEKORRIGERT.md for fullstendig begrunnelse."""
    inntekter = df[
        (df["side"] == "inntekt") &
        (df["post_nr"] < 90) &
        (~df["kap_nr"].isin(PETRO_KAP_INNTEKT))
    ]

    # Skatter og avgifter (omr 25)
    skatt_omr = inntekter[inntekter["omr_nr"] == 25]

    # Merverdiavgift (kap 5521)
    mva_belop = int(skatt_omr[skatt_omr["kap_nr"] == 5521]["GB"].sum())

    # Trygdeavgift (kap 5700 post 71)
    trygd_belop = int(
        inntekter[
            (inntekter["kap_nr"] == 5700) & (inntekter["post_nr"] == 71)
        ]["GB"].sum()
    )

    # Arbeidsgiveravgift (kap 5700 post 72)
    arb_avg_belop = int(
        inntekter[
            (inntekter["kap_nr"] == 5700) & (inntekter["post_nr"] == 72)
        ]["GB"].sum()
    )

    # Skatt på inntekt og formue (kap 5501)
    skatt_person_belop = int(
        skatt_omr[skatt_omr["kap_nr"] == 5501]["GB"].sum()
    )

    # Øvrige inntekter: totalt minus de kjente kategoriene
    # (petroleumskapitler og post >= 90 er allerede filtrert bort)
    totalt = int(inntekter["GB"].sum())
    kjent_sum = mva_belop + arb_avg_belop + trygd_belop + skatt_person_belop
    ovrige_belop = totalt - kjent_sum

    # Beregn omr_gruppe for "Øvrige inntekter" dynamisk (ekskl. omr 25 og 34)
    ovrige_inn_omr = sorted(
        inntekter[
            (inntekter["omr_nr"] != 25) &
            (inntekter["omr_nr"] != 34)
        ]["omr_nr"].unique().tolist()
    )

    kategorier = [
        {"id": "skatt_person", "navn": "Skatt på inntekt og formue", "belop": skatt_person_belop, "omr_nr": 25},
        {"id": "mva", "navn": "Merverdiavgift", "belop": mva_belop, "omr_nr": 25},
        {"id": "arbeidsgiveravgift", "navn": "Arbeidsgiveravgift", "belop": arb_avg_belop, "omr_nr": 25},
        {"id": "trygdeavgift", "navn": "Trygdeavgift", "belop": trygd_belop, "omr_nr": 25},
        {"id": "ovrige_inntekter", "navn": "Øvrige inntekter", "belop": ovrige_belop, "omr_gruppe": ovrige_inn_omr},
    ]

    # Sorter fra størst til minst, tildel farge fra monokromatisk teal-skala
    kategorier.sort(key=lambda x: x["belop"], reverse=True)
    for i, kat in enumerate(kategorier):
        kat["farge"] = INNTEKT_FARGESKALA[i] if i < len(INNTEKT_FARGESKALA) else INNTEKT_FARGESKALA[-1]

    return kategorier


def beregn_oljekorrigert(df: pd.DataFrame) -> dict:
    """Beregner oljekorrigerte totaler (uten olje og gass).
    Se OLJEKORRIGERT.md for fullstendig begrunnelse."""
    utg = df[
        (df["side"] == "utgift") &
        (df["post_nr"] < 90) &
        (~df["kap_nr"].isin(PETRO_KAP_UTGIFT))
    ]
    inn = df[
        (df["side"] == "inntekt") &
        (df["post_nr"] < 90) &
        (~df["kap_nr"].isin(PETRO_KAP_INNTEKT))
    ]
    utgifter_total = int(utg["GB"].sum())
    inntekter_total = int(inn["GB"].sum())
    underskudd = utgifter_total - inntekter_total

    return {
        "utgifter_total": utgifter_total,
        "inntekter_total": inntekter_total,
        "underskudd": underskudd,
    }


def hent_manuelle_tall(budsjettaar: int) -> dict:
    """Henter manuelt innlagte tall for et budsjettår (strukturelt underskudd m.m.)."""
    return MANUELLE_TALL.get(budsjettaar, {})


if __name__ == "__main__":
    from pathlib import Path
    from les_gul_bok import les_gul_bok

    rotmappe = Path(__file__).parent.parent
    df = les_gul_bok(rotmappe / "Gul bok 2025.xlsx")

    spu = beregn_spu(df)
    print("SPU-nøkkeltall:")
    print(f"  Overføring til fond: {spu['overfoering_til_fond'] / 1e9:.1f} mrd. kr")
    print(f"  Finansposter til fond: {spu['finansposter_til_fond'] / 1e9:.1f} mrd. kr")
    print(f"  Overføring fra fond: {spu['overfoering_fra_fond'] / 1e9:.1f} mrd. kr")
    print(f"  Netto overføring: {spu['netto_overfoering'] / 1e9:.1f} mrd. kr")
    print(f"  Fondsuttak: {spu['fondsuttak'] / 1e9:.1f} mrd. kr")
    print(f"  Netto kontantstrøm: {spu['netto_kontantstrom'] / 1e9:.1f} mrd. kr")
    print("  Kontantstrøm-kilder:")
    for k in spu["kontantstrom_kilder"]:
        print(f"    {k['navn']}: {k['belop'] / 1e9:.1f} mrd. kr")

    print("\nAggregert utgifter (uten SPU):")
    for kat in generer_aggregert_utgifter(df):
        print(f"  {kat['navn']}: {kat['belop'] / 1e9:.1f} mrd. kr [{kat['farge']}]")

    print("\nAggregert inntekter (uten SPU):")
    for kat in generer_aggregert_inntekter(df):
        print(f"  {kat['navn']}: {kat['belop'] / 1e9:.1f} mrd. kr [{kat['farge']}]")
