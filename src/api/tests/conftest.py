import logging
import os
import tempfile
from typing import Annotated

import pytest
from fastapi import Header
from playhouse.sqlite_ext import SqliteExtDatabase

import api.items
import api.pwmodels
import api.system

AUTH_USER = {"Authorization": "8,user"}
AUTH_USER_ID = 8
AUTH_ADMIN = {"Authorization": "1,admin"}


def headers_auth(user: api.pwmodels.User) -> dict[str, str]:
    return {"Authorization": f"{user.id},{user.role}"}


@pytest.fixture(autouse=True, scope="module")
def _maxlogging():
    "Force max logging"
    logging.getLogger().setLevel(level=logging.DEBUG)


@pytest.fixture(autouse=True)
def dbtables():
    "Initialize DB tables in a temporary file"

    # Note: Memory does not seem to exists for multiple connections
    with tempfile.NamedTemporaryFile() as tmpfile:
        logging.getLogger("peewee").setLevel(logging.INFO)
        database = SqliteExtDatabase(
            tmpfile.name, pragmas={"foreign_keys": 1}, autoconnect=False
        )
        api.pwmodels.db.initialize(database)

        database.register_function(api.pwmodels.regexp, "regexp", 2)

        with database:
            api.pwmodels.create_all_tables()
            api.pwmodels.User.create(id=1, name="admin", role="admin")
            api.pwmodels.User.create(id=8, name="user")
        logging.getLogger("peewee").setLevel(logging.DEBUG)
        yield None


@pytest.fixture
def fakestorage(monkeypatch):
    tmpdir = tempfile.TemporaryDirectory()
    os.makedirs(f"{tmpdir.name}/img")
    os.makedirs(f"{tmpdir.name}/thumb")
    monkeypatch.setattr(api.items, "LUDO_STORAGE", tmpdir.name)
    yield tmpdir.name
    tmpdir.cleanup()


def fake_auth_user(
    authorization: Annotated[str | None, Header()] = None,
) -> api.system.AuthUser | None:
    if not authorization:
        return None
    user_id, user_role = authorization.split(",")
    return api.system.AuthUser(int(user_id), user_role)
