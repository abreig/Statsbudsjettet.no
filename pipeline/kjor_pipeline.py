"""
Hovedskript for datapipelinen.
Kjører alle steg i sekvens: innlesing → hierarki → berikelse → eksport → validering.
"""

import sys
from pathlib import Path

# Legg til pipeline-mappen i PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent))

from les_gul_bok import les_gul_bok, valider_grunndata
from bygg_hierarki import bygg_komplett_hierarki
from berikelse import beregn_spu, generer_aggregert_utgifter, generer_aggregert_inntekter
from eksporter import eksporter_full, eksporter_aggregert, eksporter_endringer, eksporter_metadata
from valider import valider_json_filer


def kjor_pipeline(kildefil: Path, budsjettaar: int, utmappe: Path) -> bool:
    """Kjører hele datapipelinen. Returnerer True ved suksess."""

    print(f"=== Datapipeline for statsbudsjettet {budsjettaar} ===\n")

    # Steg 1: Innlesing og validering
    print("Steg 1: Innlesing og validering...")
    df = les_gul_bok(kildefil)
    resultater = valider_grunndata(df)
    print(f"  {resultater['antall_rader']} rader lest.")
    print(f"  Utgifter: {resultater['antall_utgiftsposter']} poster, "
          f"{resultater['total_utgifter_kr'] / 1e9:.1f} mrd. kr")
    print(f"  Inntekter: {resultater['antall_inntektsposter']} poster, "
          f"{resultater['total_inntekter_kr'] / 1e9:.1f} mrd. kr")

    # Steg 2-3: Hierarkisk aggregering
    print("\nSteg 2-3: Hierarkisk aggregering...")
    hierarki = bygg_komplett_hierarki(df)
    print(f"  Utgiftsområder: {len(hierarki['utgifter']['omraader'])}")
    print(f"  Inntektsområder: {len(hierarki['inntekter']['omraader'])}")

    # Steg 4: SPU-beregninger og berikelse
    print("\nSteg 4: SPU-beregninger og berikelse...")
    spu = beregn_spu(df)
    print(f"  Overføring til fond: {spu['overfoering_til_fond'] / 1e9:.1f} mrd. kr")
    print(f"  Overføring fra fond: {spu['overfoering_fra_fond'] / 1e9:.1f} mrd. kr")
    print(f"  Netto: {spu['netto_overfoering'] / 1e9:.1f} mrd. kr")

    utgifter_agg = generer_aggregert_utgifter(df)
    inntekter_agg = generer_aggregert_inntekter(df)
    print(f"  Aggregerte utgiftskategorier: {len(utgifter_agg)}")
    print(f"  Aggregerte inntektskategorier: {len(inntekter_agg)}")

    # Steg 5: Eksport
    print("\nSteg 5: Eksport til JSON...")
    utmappe.mkdir(parents=True, exist_ok=True)

    f1 = eksporter_full(hierarki, spu, budsjettaar, utmappe)
    print(f"  → {f1} ({f1.stat().st_size / 1024:.1f} KB)")

    f2 = eksporter_aggregert(utgifter_agg, inntekter_agg, spu, budsjettaar, utmappe)
    print(f"  → {f2} ({f2.stat().st_size / 1024:.1f} KB)")

    f3 = eksporter_endringer(budsjettaar, utmappe)
    print(f"  → {f3} ({f3.stat().st_size / 1024:.1f} KB)")

    f4 = eksporter_metadata(
        budsjettaar, spu,
        hierarki["utgifter"]["total"],
        hierarki["inntekter"]["total"],
        utmappe,
    )
    print(f"  → {f4} ({f4.stat().st_size / 1024:.1f} KB)")

    # Steg 6: Validering
    print("\nSteg 6: Validering...")
    feil = valider_json_filer(utmappe, budsjettaar)

    if feil:
        print("  VALIDERINGSFEIL:")
        for f in feil:
            print(f"    ✗ {f}")
        return False
    else:
        print("  ✓ Alle valideringer bestått.")
        return True


if __name__ == "__main__":
    rotmappe = Path(__file__).parent.parent

    # Støtt årstall som CLI-argument, eller kjør for alle tilgjengelige år
    if len(sys.argv) > 1:
        aar_liste = [int(a) for a in sys.argv[1:]]
    else:
        # Finn alle Gul bok-filer automatisk
        aar_liste = sorted(
            int(f.stem.split()[-1])
            for f in rotmappe.glob("Gul bok *.xlsx")
        )

    if not aar_liste:
        print("Ingen Gul bok-filer funnet!")
        sys.exit(1)

    alle_ok = True
    for aar in aar_liste:
        kildefil = rotmappe / f"Gul bok {aar}.xlsx"
        utmappe = rotmappe / "data" / str(aar)

        if not kildefil.exists():
            print(f"Finner ikke {kildefil}, hopper over.")
            continue

        suksess = kjor_pipeline(kildefil, aar, utmappe)
        if not suksess:
            alle_ok = False
        print()

    sys.exit(0 if alle_ok else 1)
