"""
Steg 1: Innlesing og validering av Gul bok (Excel).
Leser kildefilen, validerer kolonner og typer, normaliserer verdier.
"""

import pandas as pd
from pathlib import Path

FORVENTEDE_KOLONNER = [
    "fdep_nr", "fdep_navn", "omr_nr", "kat_nr", "omr_navn", "kat_navn",
    "kap_nr", "post_nr", "upost_nr", "kap_navn", "post_navn", "stikkord", "GB",
]

NØKKELFELT = ["fdep_nr", "omr_nr", "kat_nr", "kap_nr", "post_nr", "upost_nr"]


def les_gul_bok(filsti: str | Path) -> pd.DataFrame:
    """Leser Gul bok Excel-fil og returnerer renset DataFrame."""
    filsti = Path(filsti)
    if not filsti.exists():
        raise FileNotFoundError(f"Finner ikke filen: {filsti}")

    df = pd.read_excel(filsti, dtype={"stikkord": str})

    # Valider kolonner
    if list(df.columns) != FORVENTEDE_KOLONNER:
        raise ValueError(
            f"Uventede kolonner.\n"
            f"Forventet: {FORVENTEDE_KOLONNER}\n"
            f"Fikk: {list(df.columns)}"
        )

    # Normaliser tekstverdier (trim mellomrom)
    for kol in ["fdep_navn", "omr_navn", "kat_navn", "kap_navn", "post_navn"]:
        df[kol] = df[kol].astype(str).str.strip()

    # Fyll NaN i stikkord med tom streng
    df["stikkord"] = df["stikkord"].fillna("").str.strip()

    # Sikre heltallstyper for nøkkelfelt
    for kol in NØKKELFELT:
        df[kol] = df[kol].astype(int)

    # Beløp som heltall (kroner)
    df["GB"] = df["GB"].astype(int)

    # Legg til side-kolonne (utgift/inntekt basert på kap_nr)
    df["side"] = df["kap_nr"].apply(lambda x: "inntekt" if x >= 3000 else "utgift")

    # Valider: ingen null-verdier i nøkkelfelt
    for kol in NØKKELFELT:
        nullverdier = df[kol].isna().sum()
        if nullverdier > 0:
            raise ValueError(f"Fant {nullverdier} null-verdier i kolonne '{kol}'")

    return df


def valider_grunndata(df: pd.DataFrame) -> dict:
    """Validerer grunnleggende egenskaper ved datasettet."""
    resultater = {
        "antall_rader": len(df),
        "antall_utgiftsposter": len(df[df["side"] == "utgift"]),
        "antall_inntektsposter": len(df[df["side"] == "inntekt"]),
        "total_utgifter_kr": int(df[df["side"] == "utgift"]["GB"].sum()),
        "total_inntekter_kr": int(df[df["side"] == "inntekt"]["GB"].sum()),
    }

    # Grunnleggende sjekker (gjelder alle år)
    if resultater["antall_rader"] < 100:
        print(f"ADVARSEL: Uvanlig få rader: {resultater['antall_rader']}")

    if resultater["antall_utgiftsposter"] == 0:
        print("ADVARSEL: Ingen utgiftsposter funnet!")

    if resultater["antall_inntektsposter"] == 0:
        print("ADVARSEL: Ingen inntektsposter funnet!")

    return resultater


if __name__ == "__main__":
    rotmappe = Path(__file__).parent.parent
    filsti = rotmappe / "Gul bok 2025.xlsx"
    df = les_gul_bok(filsti)
    resultater = valider_grunndata(df)
    print(f"Innlesing OK: {resultater['antall_rader']} rader")
    print(f"  Utgifter: {resultater['antall_utgiftsposter']} poster, {resultater['total_utgifter_kr'] / 1e9:.1f} mrd. kr")
    print(f"  Inntekter: {resultater['antall_inntektsposter']} poster, {resultater['total_inntekter_kr'] / 1e9:.1f} mrd. kr")
