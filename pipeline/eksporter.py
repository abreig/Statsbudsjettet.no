"""
Steg 5: JSON-eksport.
Eksporterer fire JSON-filer til data/ÅRSTALL/.
"""

import json
from pathlib import Path
from datetime import date


def eksporter_full(hierarki: dict, spu: dict, budsjettaar: int, utmappe: Path) -> Path:
    """Eksporterer komplett hierarki til gul_bok_full.json."""
    data = {
        "budsjettaar": budsjettaar,
        "publisert": date.today().isoformat(),
        "valuta": "NOK",
        "utgifter": hierarki["utgifter"],
        "inntekter": hierarki["inntekter"],
        "spu": spu,
        "metadata": {
            "kilde": f"Gul bok {budsjettaar}",
            "saldert_budsjett_forrige": str(budsjettaar - 1),
        },
    }

    filsti = utmappe / "gul_bok_full.json"
    with open(filsti, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return filsti


def eksporter_aggregert(
    utgifter_agg: list[dict],
    inntekter_agg: list[dict],
    spu: dict,
    budsjettaar: int,
    utmappe: Path,
) -> Path:
    """Eksporterer aggregert datasett til gul_bok_aggregert.json."""
    data = {
        "budsjettaar": budsjettaar,
        "utgifter_aggregert": utgifter_agg,
        "inntekter_aggregert": inntekter_agg,
        "spu": spu,
    }

    filsti = utmappe / "gul_bok_aggregert.json"
    with open(filsti, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return filsti


def eksporter_endringer(budsjettaar: int, utmappe: Path) -> Path:
    """Eksporterer tomt endringsdatasett (placeholder uten saldert-data)."""
    data = {
        "budsjettaar": budsjettaar,
        "saldert_kilde": None,
        "utgifter": {"endringer": []},
        "inntekter": {"endringer": []},
    }

    filsti = utmappe / "gul_bok_endringer.json"
    with open(filsti, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return filsti


def eksporter_metadata(budsjettaar: int, spu: dict, total_utgifter: int, total_inntekter: int, utmappe: Path) -> Path:
    """Eksporterer metadata.json."""
    data = {
        "budsjettaar": budsjettaar,
        "publisert": date.today().isoformat(),
        "kilde": f"Gul bok {budsjettaar}",
        "saldert_budsjett_forrige": str(budsjettaar - 1),
        "totaler": {
            "utgifter": total_utgifter,
            "inntekter": total_inntekter,
        },
        "spu": spu,
        "antall_poster": {
            "utgifter": None,
            "inntekter": None,
        },
    }

    filsti = utmappe / "metadata.json"
    with open(filsti, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return filsti
