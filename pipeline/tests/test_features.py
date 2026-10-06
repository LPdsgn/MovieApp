from moovie_pipeline.features import Entity, iso_date, minutes, parse, truthy


def item(qid, rank="normal"):
    return {
        "rank": rank,
        "mainsnak": {"datavalue": {"value": {"id": f"Q{qid}", "numeric-id": qid}}},
    }


def time(t, precision=11, rank="normal"):
    return {"rank": rank, "mainsnak": {"datavalue": {"value": {"time": t, "precision": precision}}}}


def quantity(amount, unit, rank="normal"):
    return {"rank": rank, "mainsnak": {"datavalue": {"value": {"amount": amount, "unit": unit}}}}


def test_truthy_prefers_preferred_and_skips_deprecated_and_novalue():
    stmts = [
        item(1),
        item(2, "preferred"),
        item(3, "deprecated"),
        {"rank": "normal", "mainsnak": {}},
    ]
    assert [v["numeric-id"] for v in truthy(stmts)] == [2]
    assert [v["numeric-id"] for v in truthy([item(1), item(3, "deprecated")])] == [1]


def test_iso_date_normalizes_precision():
    assert iso_date({"time": "+1999-03-31T00:00:00Z", "precision": 11}) == "1999-03-31"
    assert iso_date({"time": "+1999-00-00T00:00:00Z", "precision": 9}) == "1999-01-01"
    assert iso_date({"time": "+1990-00-00T00:00:00Z", "precision": 8}) is None  # decade
    assert iso_date({"time": "-0050-00-00T00:00:00Z", "precision": 9}) is None


def test_minutes_converts_units():
    assert minutes({"amount": "+136", "unit": "http://www.wikidata.org/entity/Q7727"}) == 136
    assert minutes({"amount": "+2.5", "unit": "http://www.wikidata.org/entity/Q25235"}) == 150
    assert minutes({"amount": "+90", "unit": "1"}) == 90
    assert minutes({"amount": "+90", "unit": "http://www.wikidata.org/entity/Q999"}) is None


def test_parse_entity():
    entity = {
        "claims": {
            "P577": [time("+1999-12-01T00:00:00Z"), time("+1999-03-31T00:00:00Z")],
            "P2047": [quantity("+136", "http://www.wikidata.org/entity/Q7727")],
            "P136": [item(471839), item(2484376), item(471839)],
            "P57": [item(1, "deprecated")],
            "P999": [item(5)],
        }
    }
    assert parse(2875, entity) == Entity(2875, "1999-03-31", 136, {"P136": [471839, 2484376]})


def test_parse_entity_without_claims():
    assert parse(1, {}) == Entity(1, None, None, {})
