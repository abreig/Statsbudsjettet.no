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


class TestMetadata:
    """Verifiser metadata."""

    def test_metadata_aar(self, metadata):
        assert metadata["budsjettaar"] == 2025

    def test_metadata_kilde(self, metadata):
        assert "Gul bok" in metadata["kilde"]
