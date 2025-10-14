import logging

from playhouse.sqlite_ext import SqliteExtDatabase

from api.pwmodels import create_all_tables, db

logging.basicConfig(level=logging.DEBUG, format="%(message)s")
database = SqliteExtDatabase(":memory:", pragmas={"foreign_keys": 1})
db.initialize(database)
create_all_tables()
