"""
Beregning av endringsdata: kobler Gul bok (forslaget) mot saldert budsjett.
Brukes til å vise endringer fra vedtatt budsjett i alle visninger.

Se ENDRINGSVISNING.md for full spesifikasjon.
"""

import pandas as pd
from pathlib import Path


def les_saldert(saldert_path: str | Path) -> pd.DataFrame:
    """
    Leser saldert budsjett og returnerer en tabell på post-nivå.
    Saldert har poster med og uten underposter — vi beholder kun
    hovedposter (upost_nr == NaN) for å matche mot Gul bok.
    """
    saldert_path = Path(saldert_path)
    if not saldert_path.exists():
        raise FileNotFoundError(f"Finner ikke saldert budsjett: {saldert_path}")

    df = pd.read_excel(saldert_path, dtype={"Stikkord": str})
    df = df.rename(columns={
        "Kap. nr":       "kap_nr",
        "Postnr.":       "post_nr",
        "Underpostnr.":  "upost_nr",
        "Postsum":       "saldert_belop",
    })

    # Behold kun poster uten underpost (hovedposter)
    df = df[df["upost_nr"].isna()][["kap_nr", "post_nr", "saldert_belop"]].copy()

    # Sikre riktige typer
    df["kap_nr"] = df["kap_nr"].astype(int)
    df["post_nr"] = df["post_nr"].astype(int)
    df["saldert_belop"] = df["saldert_belop"].astype(int)

    return df


def beregn_endringsdata(gul_bok_df: pd.DataFrame,
                         saldert: pd.DataFrame) -> pd.DataFrame:
    """
    Kobler Gul bok (med underposter) mot saldert budsjett (post-nivå).

    Gul bok aggregeres først til post-nivå (summerer underposter) for kobling.
    Endringsdata skrives tilbake til original-dataframen med underposter.

    Returnerer Gul bok-dataframen beriket med:
    - saldert_belop: beløp fra saldert budsjett (på post-nivå, NaN for nye poster)
    - endring_absolut: gb_belop - saldert_belop
    - endring_prosent: prosentvis endring (None ved divisjon med 0 / ny post)
    - er_ny_post: True hvis posten ikke finnes i saldert
    """
    # Aggreger Gul bok til post-nivå (summer underposter)
    gb_post = (
        gul_bok_df
        .groupby(["kap_nr", "post_nr"])["GB"]
        .sum()
        .reset_index()
        .rename(columns={"GB": "gb_post_belop"})
    )

    # Koble mot saldert — left join beholder alle Gul bok-poster
    merged = gb_post.merge(
        saldert,
        on=["kap_nr", "post_nr"],
        how="left",
    )

    # Beregn endringer på post-nivå
    merged["endring_absolut"] = merged["gb_post_belop"] - merged["saldert_belop"]

    merged["endring_prosent"] = merged.apply(
        lambda r: (
            None if pd.isna(r["saldert_belop"]) or r["saldert_belop"] == 0
            else round(r["endring_absolut"] / abs(r["saldert_belop"]) * 100, 1)
        ),
        axis=1,
    )

    merged["er_ny_post"] = merged["saldert_belop"].isna()

    # Koble tilbake til original-dataframe (med underposter)
    endring_kolonner = merged[
        ["kap_nr", "post_nr", "saldert_belop", "endring_absolut", "endring_prosent", "er_ny_post"]
    ]

    resultat = gul_bok_df.merge(
        endring_kolonner,
        on=["kap_nr", "post_nr"],
        how="left",
    )

    return resultat


def valider_endringsdata(merged: pd.DataFrame) -> list[str]:
    """
    Validerer kvaliteten på koblingen.
    Returnerer liste med advarsler (tom = alt OK).
    """
    advarsler = []

    # Beregn antall unike poster (ikke underposter) uten match
    poster = merged.drop_duplicates(subset=["kap_nr", "post_nr"])
    antall_poster = len(poster)
    antall_nye = poster["er_ny_post"].sum()
    andel_nye = antall_nye / antall_poster if antall_poster > 0 else 0

    if andel_nye > 0.10:
        advarsler.append(
            f"For mange poster uten saldert-match: {andel_nye:.1%} "
            f"({int(antall_nye)} av {antall_poster})"
        )

    # Sjekk at saldert-totalene er rimelige
    saldert_total = poster["saldert_belop"].sum()
    if saldert_total <= 0:
        advarsler.append(f"Saldert totalbeløp er 0 eller negativt: {saldert_total}")

    return advarsler


def statistikk_endringsdata(merged: pd.DataFrame) -> dict:
    """Returnerer nyttig statistikk om endringsdata."""
    poster = merged.drop_duplicates(subset=["kap_nr", "post_nr"])
    return {
        "antall_poster_gb": len(poster),
        "antall_med_match": int((~poster["er_ny_post"]).sum()),
        "antall_nye_poster": int(poster["er_ny_post"].sum()),
        "matchrate_prosent": round(
            (~poster["er_ny_post"]).sum() / len(poster) * 100, 1
        ) if len(poster) > 0 else 0,
        "saldert_total_mrd": round(poster["saldert_belop"].sum() / 1e9, 1),
        "gb_total_mrd": round(poster["GB"].sum() / 1e9, 1),
        "endring_total_mrd": round(
            (poster["GB"].sum() - poster[~poster["er_ny_post"]]["saldert_belop"].sum()) / 1e9, 1
        ),
    }


if __name__ == "__main__":
    from les_gul_bok import les_gul_bok

    rotmappe = Path(__file__).parent.parent
    gb = les_gul_bok(rotmappe / "Gul bok 2026.xlsx")
    saldert = les_saldert(rotmappe / "Saldert budsjett 2025.xlsx")

    print(f"Gul bok: {len(gb)} rader")
    print(f"Saldert: {len(saldert)} poster")

    merged = beregn_endringsdata(gb, saldert)

    stat = statistikk_endringsdata(merged)
    for k, v in stat.items():
        print(f"  {k}: {v}")

    advarsler = valider_endringsdata(merged)
    if advarsler:
        print("\nAdvarsler:")
        for a in advarsler:
            print(f"  ⚠ {a}")
    else:
        print("\n✓ Ingen advarsler.")
