import logging

from peewee import SqliteDatabase

from api.pwmodels import create_all_tables, db

logging.basicConfig(level=logging.DEBUG, format="%(message)s")
database = SqliteDatabase(":memory:", pragmas={"foreign_keys": 1})
db.initialize(database)
create_all_tables()
