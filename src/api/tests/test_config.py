import peewee
import pytest
from conftest import AUTH_ADMIN, AUTH_USER, fake_auth_user
from fastapi.testclient import TestClient

from api.config import get_config, get_config_all
from api.main import app
from api.pwmodels import Config, db
from api.system import auth_user

client = TestClient(app)
app.dependency_overrides[auth_user] = fake_auth_user


# ---------------------------------------------------------------------------
# get_config / get_config_all - defaults
# ---------------------------------------------------------------------------


def test_get_config_returns_default():
    assert get_config("loan_weeks") == 3
    assert get_config("loan_weeks_summer") == 8
    assert get_config("loan_maxitems") == 8
    assert get_config("apikey_prefix") == "akld"
    assert get_config("summer_mode") is False
    assert get_config("planning_url") == ""


def test_get_config_pricing_default():
    pricing = get_config("pricing")
    assert isinstance(pricing, dict)
    assert pricing["regular"] == 0.5
    assert pricing["big"] == 5
    assert pricing["card"] == 12


def test_get_config_unknown_key_returns_none():
    assert get_config("does_not_exist") is None


def test_get_config_all_contains_defaults():
    cfg = get_config_all()
    # spot-check all default keys
    assert cfg["auth_domain"] == "dev-th8igg4x0hj35r1b.eu.auth0.com"
    assert cfg["loan_weeks"] == 3
    assert cfg["loan_extend_max"] == 1
    assert cfg["image_max_dim"] == 800
    assert cfg["thumb_dim"] == 200
    assert cfg["email_sender"] == "laludodupoissonlune@gmail.com"
    assert isinstance(cfg["pricing"], dict)
    assert cfg["pricing"]["regular"] == 0.5


def test_get_config_all_pricing_has_all_keys():
    cfg = get_config_all()
    for key in (
        "regular",
        "regular_summer",
        "big",
        "big_associations",
        "card",
        "card_value",
        "yearly",
    ):
        assert key in cfg["pricing"]


# ---------------------------------------------------------------------------
# get_config / get_config_all - DB overrides
# ---------------------------------------------------------------------------


def test_get_config_override():
    with db:
        Config.create(key="loan_weeks", value=99)

    assert get_config("loan_weeks") == 99
    # other defaults unaffected
    assert get_config("loan_weeks_summer") == 8


def test_get_config_override_bool_and_string():
    with db:
        Config.create(key="summer_mode", value=True)
        Config.create(key="planning_url", value="https://example.com")

    assert get_config("summer_mode") is True
    assert get_config("planning_url") == "https://example.com"


def test_get_config_all_override():
    with db:
        Config.create(key="loan_weeks", value=99)
        Config.create(key="apikey_prefix", value="custom")

    cfg = get_config_all()
    assert cfg["loan_weeks"] == 99
    assert cfg["apikey_prefix"] == "custom"
    # defaults still present for non-overridden keys
    assert cfg["loan_maxitems"] == 8


def test_get_config_all_override_pricing_partial():
    with db:
        Config.create(key="pricing", value={"regular": 99, "big": 42})

    cfg = get_config_all()
    # DB value replaces the whole pricing dict (no merge on read)
    assert cfg["pricing"] == {"regular": 99, "big": 42}


# ---------------------------------------------------------------------------
# OperationalError branches
# ---------------------------------------------------------------------------


def test_get_config_all_operational_error_returns_empty(monkeypatch):
    def _raise(*_a, **_kw):
        raise peewee.OperationalError("db down")

    monkeypatch.setattr(Config, "select", _raise)
    assert get_config_all() == {}


def test_get_config_operational_error_returns_default(monkeypatch):
    def _raise(*_a, **_kw):
        raise peewee.OperationalError("db down")

    monkeypatch.setattr(Config, "get", _raise)
    # known key → default
    assert get_config("loan_weeks") == 3
    assert get_config("pricing") == {
        "regular": 0.5,
        "regular_summer": 1,
        "big": 5,
        "big_associations": 7,
        "card": 12,
        "card_value": 14,
        "yearly": 10,
    }


def test_get_config_operational_error_unknown_returns_none(monkeypatch):
    def _raise(*_a, **_kw):
        raise peewee.OperationalError("db down")

    monkeypatch.setattr(Config, "get", _raise)
    assert get_config("does_not_exist") is None


def test_get_config_does_not_exist_falls_back_to_default():
    # No row in DB → DoesNotExist branch, should return default
    assert get_config("loan_weeks") == 3
    assert get_config("unknown_xyz") is None


# ---------------------------------------------------------------------------
# db closed handling (need_close branch)
# ---------------------------------------------------------------------------


def test_get_config_works_when_db_closed():
    # conftest leaves db closed between tests; ensure it stays closed after call
    if not db.is_closed():
        db.close()
    assert db.is_closed()
    assert get_config("loan_weeks") == 3
    assert db.is_closed()


def test_get_config_all_works_when_db_closed():
    if not db.is_closed():
        db.close()
    assert db.is_closed()
    cfg = get_config_all()
    assert cfg["loan_weeks"] == 3
    assert db.is_closed()


def test_get_config_works_when_db_already_open():
    with db:
        Config.create(key="loan_weeks", value=77)
        # inside the context db is open → need_close == False
        assert get_config("loan_weeks") == 77
        assert not db.is_closed()

        cfg = get_config_all()
        assert cfg["loan_weeks"] == 77
        assert not db.is_closed()

    # after context db is closed again
    assert db.is_closed()


# ---------------------------------------------------------------------------
# Router GET /config - auth
# ---------------------------------------------------------------------------


def test_router_get_config_unauthenticated():
    response = client.get("/config")
    assert response.status_code == 401


def test_router_get_config_forbidden_for_user():
    response = client.get("/config", headers=AUTH_USER)
    assert response.status_code == 403


def test_router_get_config_success_admin():
    response = client.get("/config", headers=AUTH_ADMIN)
    assert response.status_code == 200
    data = response.json()
    assert data["loan_weeks"] == 3
    assert data["pricing"]["regular"] == 0.5


def test_router_get_config_reflects_db_override():
    with db:
        Config.create(key="loan_weeks", value=55)

    response = client.get("/config", headers=AUTH_ADMIN)
    assert response.status_code == 200
    assert response.json()["loan_weeks"] == 55


# ---------------------------------------------------------------------------
# Router POST /config - auth + persistence
# ---------------------------------------------------------------------------


def test_router_set_config_unauthenticated():
    response = client.post("/config", json={"loan_weeks": 10})
    assert response.status_code == 401


def test_router_set_config_forbidden_for_user():
    response = client.post("/config", json={"loan_weeks": 10}, headers=AUTH_USER)
    assert response.status_code == 403


def test_router_set_config_create_new_key():
    response = client.post("/config", json={"loan_weeks": 10}, headers=AUTH_ADMIN)
    assert response.status_code == 200
    assert response.json() == {"success": True}

    assert get_config("loan_weeks") == 10
    # GET reflects it
    assert client.get("/config", headers=AUTH_ADMIN).json()["loan_weeks"] == 10


def test_router_set_config_update_existing():
    client.post("/config", json={"loan_weeks": 10}, headers=AUTH_ADMIN)
    client.post("/config", json={"loan_weeks": 20}, headers=AUTH_ADMIN)

    assert get_config("loan_weeks") == 20
    with db:
        assert Config.select().where(Config.key == "loan_weeks").count() == 1


def test_router_set_config_multiple_keys():
    response = client.post(
        "/config",
        json={"loan_weeks": 11, "loan_maxitems": 20, "summer_mode": True},
        headers=AUTH_ADMIN,
    )
    assert response.status_code == 200
    assert get_config("loan_weeks") == 11
    assert get_config("loan_maxitems") == 20
    assert get_config("summer_mode") is True


def test_router_set_config_pricing_merge_creates():
    # First pricing update: partial dict should merge with defaults
    response = client.post(
        "/config", json={"pricing": {"regular": 999}}, headers=AUTH_ADMIN
    )
    assert response.status_code == 200

    pricing = get_config("pricing")
    assert pricing["regular"] == 999
    # other default keys preserved via merge
    assert pricing["big"] == 5
    assert pricing["card"] == 12
    assert pricing["yearly"] == 10


def test_router_set_config_pricing_merge_preserves_previous():
    # Two successive partial updates should accumulate
    client.post("/config", json={"pricing": {"regular": 999}}, headers=AUTH_ADMIN)
    client.post("/config", json={"pricing": {"big": 42}}, headers=AUTH_ADMIN)

    pricing: dict[str, int] = get_config("pricing")  # ty:ignore[invalid-assignment]
    assert pricing["regular"] == 999
    assert pricing["big"] == 42
    # untouched default still there
    assert pricing["card"] == 12


def test_router_set_config_pricing_merge_with_existing_db_value():
    with db:
        Config.create(key="pricing", value={"regular": 1, "big": 2, "card": 3})

    client.post("/config", json={"pricing": {"big": 99}}, headers=AUTH_ADMIN)

    pricing = get_config("pricing")
    assert pricing == {"regular": 1, "big": 99, "card": 3}


def test_router_set_config_non_pricing_overwrites():
    client.post("/config", json={"loan_weeks": 5}, headers=AUTH_ADMIN)
    client.post("/config", json={"loan_weeks": 6}, headers=AUTH_ADMIN)
    assert get_config("loan_weeks") == 6


def test_router_set_config_custom_key():
    # Keys not in defaults should be stored and returned
    client.post("/config", json={"my_custom": "hello"}, headers=AUTH_ADMIN)
    assert get_config("my_custom") == "hello"
    assert client.get("/config", headers=AUTH_ADMIN).json()["my_custom"] == "hello"


def test_router_set_config_empty_body():
    response = client.post("/config", json={}, headers=AUTH_ADMIN)
    assert response.status_code == 200
    assert response.json() == {"success": True}


@pytest.mark.parametrize(("key", "value"), [("loan_weeks", 3), ("summer_mode", False)])
def test_router_set_config_idempotent_same_value(key, value):
    client.post("/config", json={key: value}, headers=AUTH_ADMIN)
    assert get_config(key) == value
    # second identical post should not duplicate rows
    client.post("/config", json={key: value}, headers=AUTH_ADMIN)
    with db:
        assert Config.select().where(Config.key == key).count() == 1
