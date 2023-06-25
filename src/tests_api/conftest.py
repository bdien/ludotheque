import os
import tempfile
import peewee
import pytest
import logging
import api.pwmodels
import api.items


@pytest.fixture(autouse=True, scope="module")
def maxlogging():
    "Force max logging"
    logging.getLogger().setLevel(level=logging.DEBUG)


@pytest.fixture(autouse=True)
def dbtables():
    "Initialize DB tables in a temporary file"

    # Note: Memory does not seem to exists for multiple connections
    with tempfile.NamedTemporaryFile() as tmpfile:
        logging.getLogger("peewee").setLevel(logging.INFO)
        database = peewee.SqliteDatabase(tmpfile.name, pragmas={"foreign_keys": 1})
        api.pwmodels.db.initialize(database)

        api.pwmodels.create_all_tables()
        logging.getLogger("peewee").setLevel(logging.DEBUG)
        yield None


@pytest.fixture
def fakestorage(monkeypatch):
    tmpdir = tempfile.TemporaryDirectory()
    os.makedirs(f"{tmpdir.name}/img")
    monkeypatch.setattr(api.items, "LUDO_STORAGE", tmpdir.name)
    yield tmpdir.name
    tmpdir.cleanup()
