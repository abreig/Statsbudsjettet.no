"""
Tester for datapipelinen.
Verifiserer kjente totaler og hierarkisk konsistens.
"""
import json
import os
import pytest

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "2025")


def les_json(filnavn):
    filsti = os.path.join(DATA_DIR, filnavn)
    with open(filsti, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def full_data():
    return les_json("gul_bok_full.json")


@pytest.fixture
def aggregert_data():
    return les_json("gul_bok_aggregert.json")


@pytest.fixture
def metadata():
    return les_json("metadata.json")


class TestKjenteTotaler:
    """Verifiser at kjente totaler stemmer (innenfor 0,5 mrd. margin)."""

    def test_utgifter_total(self, full_data):
        total = full_data["utgifter"]["total"]
        forventet = 2970.9e9
        assert abs(total - forventet) < 0.5e9, f"Utgifter: {total/1e9:.1f} mrd != {forventet/1e9:.1f} mrd"

    def test_inntekter_total(self, full_data):
        total = full_data["inntekter"]["total"]
        forventet = 2796.8e9
        assert abs(total - forventet) < 0.5e9, f"Inntekter: {total/1e9:.1f} mrd != {forventet/1e9:.1f} mrd"

    def test_spu_til_fond(self, full_data):
        verdi = full_data["spu"]["overfoering_til_fond"]
        forventet = 642.8e9
        assert abs(verdi - forventet) < 0.5e9

    def test_spu_fra_fond(self, full_data):
        verdi = full_data["spu"]["overfoering_fra_fond"]
        forventet = 413.6e9
        assert abs(verdi - forventet) < 0.5e9


class TestHierarkiKonsistens:
    """Verifiser at aggregerte tall stemmer med hierarkiet."""

    def test_utgifter_omraader_summerer(self, full_data):
        total = full_data["utgifter"]["total"]
        sum_omraader = sum(o["total"] for o in full_data["utgifter"]["omraader"])
        assert abs(total - sum_omraader) < 1000, "Utgifter: total != sum(omraader)"

    def test_inntekter_omraader_summerer(self, full_data):
        total = full_data["inntekter"]["total"]
        sum_omraader = sum(o["total"] for o in full_data["inntekter"]["omraader"])
        assert abs(total - sum_omraader) < 1000, "Inntekter: total != sum(omraader)"

    def test_kategorier_summerer_til_omraade(self, full_data):
        for omr in full_data["utgifter"]["omraader"]:
            sum_kat = sum(k["total"] for k in omr["kategorier"])
            assert abs(omr["total"] - sum_kat) < 1000, (
                f"Omr {omr['omr_nr']} ({omr['navn']}): total {omr['total']} != sum(kat) {sum_kat}"
            )


class TestAggregertData:
    """Verifiser at aggregert data er korrekt."""

    def test_aggregert_budsjettaar(self, aggregert_data):
        assert aggregert_data["budsjettaar"] == 2025

    def test_aggregert_har_utgifter(self, aggregert_data):
        assert len(aggregert_data["utgifter_aggregert"]) > 0

    def test_aggregert_har_inntekter(self, aggregert_data):
        assert len(aggregert_data["inntekter_aggregert"]) > 0

    def test_aggregert_har_spu(self, aggregert_data):
        assert "spu" in aggregert_data

    def test_aggregert_under_50kb(self):
        filsti = os.path.join(DATA_DIR, "gul_bok_aggregert.json")
        storrelse = os.path.getsize(filsti)
        assert storrelse < 50_000, f"Aggregert fil er {storrelse} bytes (> 50 KB)"


class TestOljekorrigerteTotaler:
    """Verifiser oljekorrigerte totaler og balanseidentitet."""

    def test_full_har_oljekorrigert(self, full_data):
        assert "oljekorrigert" in full_data
        assert full_data["oljekorrigert"]["utgifter_total"] > 0
        assert full_data["oljekorrigert"]["inntekter_total"] > 0

    def test_oljekorrigert_utgifter_2025(self, full_data):
        ok_utg = full_data["oljekorrigert"]["utgifter_total"]
        forventet = 2246.0e9
        assert abs(ok_utg - forventet) < 0.5e9, f"Oljekorrigert utg: {ok_utg/1e9:.1f} mrd != {forventet/1e9:.1f} mrd"

    def test_barer_balanserer(self, aggregert_data):
        sum_utg = sum(k["belop"] for k in aggregert_data["utgifter_aggregert"])
        sum_inn = sum(k["belop"] for k in aggregert_data["inntekter_aggregert"])
        fondsuttak = aggregert_data["spu"]["fondsuttak"]
        assert abs(sum_utg - sum_inn - fondsuttak) < 1000, (
            f"Barer balanserer ikke: utg={sum_utg}, inn={sum_inn}, fond={fondsuttak}"
        )

    def test_aggregert_total_utgifter_stemmer(self, aggregert_data):
        sum_utg = sum(k["belop"] for k in aggregert_data["utgifter_aggregert"])
        assert aggregert_data["total_utgifter"] == sum_utg

    def test_aggregert_total_inntekter_balansert(self, aggregert_data):
        """total_inntekter skal være lik total_utgifter (balansert budsjett)."""
        assert aggregert_data["total_inntekter"] == aggregert_data["total_utgifter"]

    def test_netto_overfoering_til_spu(self, full_data):
        spu = full_data["spu"]
        assert "netto_overfoering_til_spu" in spu
        forventet = spu["netto_kontantstrom"] - spu["fondsuttak"]
        assert spu["netto_overfoering_til_spu"] == forventet


class TestMetadata:
    """Verifiser metadata."""

    def test_metadata_aar(self, metadata):
        assert metadata["budsjettaar"] == 2025

    def test_metadata_kilde(self, metadata):
        assert "Gul bok" in metadata["kilde"]

    def test_metadata_har_oljekorrigert_totaler(self, metadata):
        assert "oljekorrigert_totaler" in metadata
        assert metadata["oljekorrigert_totaler"]["utgifter"] > 0
