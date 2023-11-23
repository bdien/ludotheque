import pytest
import api.system
from api.system import auth_user
from api.pwmodels import EMail, User, db
from api.config import APIKEY_PREFIX


@pytest.fixture(autouse=True)
def _clear_cache():
    auth_user.cache_clear()


def test_auth_apikey():
    with db:
        user = User.create(name="A", apikey=f"{APIKEY_PREFIX}ABC")

    # Should not authenticate with an invalid apikey
    result = auth_user("Basic ABC")
    assert not result
    result = auth_user("Bearer ABC")
    assert not result
    result = auth_user(f"Bearer {APIKEY_PREFIX}ABCD")
    assert not result

    # Should work
    result = auth_user(f"Bearer {APIKEY_PREFIX}ABC")
    assert result
    assert result.id == user.id


def test_auth_apikey_userdisabled():
    with db:
        User.create(name="A", enabled=False, apikey=f"{APIKEY_PREFIX}ABC")

    result = auth_user(f"Bearer {APIKEY_PREFIX}ABC")
    assert not result


def test_auth_token(monkeypatch):
    monkeypatch.setattr(api.system, "__validate_token", lambda e: e.split(" ", 1)[1])

    with db:
        User.create(name="B")
        user = User.create(name="A")
        EMail.create(user_id=user.id, email="valid@email")

    # Should not authenticate with an invalid apikey
    result = auth_user("Bearer invalid@email")
    assert not result

    # Should work
    result = auth_user("Bearer valid@email")
    assert result
    assert result.id == user.id


def test_auth_token_userdisabled(monkeypatch):
    monkeypatch.setattr(api.system, "__validate_token", lambda e: e.split(" ", 1)[1])

    with db:
        user = User.create(name="A", enabled=False)
        EMail.create(user_id=user.id, email="valid@email")

    result = auth_user("Bearer valid@email")
    assert not result
