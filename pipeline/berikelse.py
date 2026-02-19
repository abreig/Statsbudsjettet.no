"""
Steg 4: Berikelse — SPU-beregninger og aggregert datasett.
Isolerer SPU-poster, beregner netto overføring, og genererer
det aggregerte datasettet for landingssiden.
"""

import pandas as pd

# Fargetildelinger fra DESIGN.md seksjon 4.5.3 og 4.5.4
UTGIFT_FARGER = {
    "folketrygden": "#181C62",       # --reg-marine
    "kommuner": "#4156A6",           # --reg-blaa
    "helse": "#F15D61",              # --reg-korall
    "naering": "#008286",            # --reg-teal
    "kunnskap": "#5B91CC",           # --reg-lyseblaa
    "forsvar": "#97499C",            # --reg-lilla
    "transport": "#60C3AD",          # --reg-mint
    "ovrige_utgifter": "#EDEDEE",    # --reg-lysgraa
    "spu_ut": "#FFDF4F",            # --reg-gul
}

INNTEKT_FARGER = {
    "skatt_person": "#4156A6",       # --reg-blaa
    "mva": "#F15D61",                # --reg-korall
    "petroleum": "#181C62",          # --reg-marine
    "arbeidsgiveravgift": "#008286", # --reg-teal
    "trygdeavgift": "#97499C",      # --reg-lilla
    "ovrige_inntekter": "#EDEDEE",   # --reg-lysgraa
    "spu_inn": "#FFDF4F",           # --reg-gul
}

# Folketrygdens programområder
FOLKETRYGD_OMRAADER = {28, 29, 30, 33}


def beregn_spu(df: pd.DataFrame) -> dict:
    """Isolerer SPU-poster og beregner nøkkeltall."""
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

    return {
        "overfoering_til_fond": int(overfoering_til),
        "finansposter_til_fond": int(finansposter),
        "overfoering_fra_fond": int(overfoering_fra),
        "netto_overfoering": netto,
    }


def generer_aggregert_utgifter(df: pd.DataFrame) -> list[dict]:
    """Genererer aggregert utgiftskategorier for stacked barplot."""
    utgifter = df[df["side"] == "utgift"]

    # Folketrygden (omr 28, 29, 30, 33)
    folketrygd_belop = int(
        utgifter[utgifter["omr_nr"].isin(FOLKETRYGD_OMRAADER)]["GB"].sum()
    )

    # SPU (omr 34 — kap < 3000)
    spu_ut_belop = int(
        utgifter[utgifter["omr_nr"] == 34]["GB"].sum()
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

    # Øvrige utgifter (resten)
    kjente_omraader = FOLKETRYGD_OMRAADER | {34, 13, 10, 7, 17, 4, 21}
    ovrige_belop = int(
        utgifter[~utgifter["omr_nr"].isin(kjente_omraader)]["GB"].sum()
    )

    kategorier = [
        {"id": "folketrygden", "navn": "Folketrygden", "belop": folketrygd_belop, "farge": UTGIFT_FARGER["folketrygden"]},
        {"id": "spu_ut", "navn": "Overføring til SPU", "belop": spu_ut_belop, "farge": UTGIFT_FARGER["spu_ut"], "type": "spu"},
        {"id": "kommuner", "navn": "Kommuner og distrikter", "belop": kommuner_belop, "farge": UTGIFT_FARGER["kommuner"]},
        {"id": "helse", "navn": "Helse og omsorg", "belop": helse_belop, "farge": UTGIFT_FARGER["helse"]},
        {"id": "kunnskap", "navn": "Kunnskapsformål", "belop": kunnskap_belop, "farge": UTGIFT_FARGER["kunnskap"]},
        {"id": "naering", "navn": "Næring og fiskeri", "belop": naering_belop, "farge": UTGIFT_FARGER["naering"]},
        {"id": "forsvar", "navn": "Forsvar", "belop": forsvar_belop, "farge": UTGIFT_FARGER["forsvar"]},
        {"id": "transport", "navn": "Innenlands transport", "belop": transport_belop, "farge": UTGIFT_FARGER["transport"]},
        {"id": "ovrige_utgifter", "navn": "Øvrige utgifter", "belop": ovrige_belop, "farge": UTGIFT_FARGER["ovrige_utgifter"]},
    ]

    # Sorter fra størst til minst (SPU holdes separat)
    spu_kat = [k for k in kategorier if k.get("type") == "spu"]
    ordinaere = sorted(
        [k for k in kategorier if k.get("type") != "spu"],
        key=lambda x: x["belop"],
        reverse=True,
    )

    return ordinaere + spu_kat


def generer_aggregert_inntekter(df: pd.DataFrame) -> list[dict]:
    """Genererer aggregert inntektskategorier for stacked barplot."""
    inntekter = df[df["side"] == "inntekt"]

    # SPU-overføring (kap 5800)
    spu_inn_belop = int(
        inntekter[inntekter["kap_nr"] == 5800]["GB"].sum()
    )

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

    # Petroleumsskatter (kap 5507)
    petroleum_belop = int(skatt_omr[skatt_omr["kap_nr"] == 5507]["GB"].sum())

    # Skatt på inntekt og formue (kap 5501 — personskatt og selskapsskatt)
    skatt_person_belop = int(
        skatt_omr[skatt_omr["kap_nr"] == 5501]["GB"].sum()
    )

    # Øvrige inntekter: totalt minus alle kjente
    totalt = int(inntekter["GB"].sum())
    kjent_sum = spu_inn_belop + mva_belop + arb_avg_belop + trygd_belop + petroleum_belop + skatt_person_belop
    ovrige_belop = totalt - kjent_sum

    kategorier = [
        {"id": "skatt_person", "navn": "Skatt på inntekt og formue", "belop": skatt_person_belop, "farge": INNTEKT_FARGER["skatt_person"]},
        {"id": "mva", "navn": "Merverdiavgift", "belop": mva_belop, "farge": INNTEKT_FARGER["mva"]},
        {"id": "petroleum", "navn": "Petroleumsskatter", "belop": petroleum_belop, "farge": INNTEKT_FARGER["petroleum"]},
        {"id": "arbeidsgiveravgift", "navn": "Arbeidsgiveravgift", "belop": arb_avg_belop, "farge": INNTEKT_FARGER["arbeidsgiveravgift"]},
        {"id": "trygdeavgift", "navn": "Trygdeavgift", "belop": trygd_belop, "farge": INNTEKT_FARGER["trygdeavgift"]},
        {"id": "ovrige_inntekter", "navn": "Øvrige inntekter", "belop": ovrige_belop, "farge": INNTEKT_FARGER["ovrige_inntekter"]},
        {"id": "spu_inn", "navn": "Overføring fra SPU", "belop": spu_inn_belop, "farge": INNTEKT_FARGER["spu_inn"], "type": "spu"},
    ]

    # Sorter fra størst til minst (SPU holdes separat)
    spu_kat = [k for k in kategorier if k.get("type") == "spu"]
    ordinaere = sorted(
        [k for k in kategorier if k.get("type") != "spu"],
        key=lambda x: x["belop"],
        reverse=True,
    )

    return ordinaere + spu_kat


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

    print("\nAggregert utgifter:")
    for kat in generer_aggregert_utgifter(df):
        print(f"  {kat['navn']}: {kat['belop'] / 1e9:.1f} mrd. kr")

    print("\nAggregert inntekter:")
    for kat in generer_aggregert_inntekter(df):
        print(f"  {kat['navn']}: {kat['belop'] / 1e9:.1f} mrd. kr")
