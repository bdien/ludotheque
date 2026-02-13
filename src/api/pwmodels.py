import os
import re
from datetime import date, datetime, timedelta

import peewee
from playhouse.shortcuts import model_to_dict
from playhouse.sqlite_ext import JSONField, SqliteExtDatabase

from api.config import LOAN_WEEKS

db = peewee.DatabaseProxy()
dbpath = os.getenv("LUDO_STORAGE", "../../storage").removesuffix("/")
db.initialize(
    SqliteExtDatabase(
        f"{dbpath}/ludotheque.db",
        autoconnect=False,
        pragmas={
            "foreign_keys": 1,
            "journal_mode": "wal",
            "temp_store": "MEMORY",
            "synchronous": "NORMAL",
            "cache_size": -64000,
        },
    )
)


@db.func()
def regexp(expr, s):
    return re.search(expr, s, re.IGNORECASE) is not None


def create_all_tables(drop=False):
    tbls = [
        User,
        EMail,
        Item,
        ItemLink,
        Category,
        ItemCategory,
        Loan,
        Ledger,
        Rating,
        Booking,
        Log,
    ]
    if drop:
        db.drop_tables(tbls)
    db.create_tables(tbls)


class BaseModel(peewee.Model):
    class Meta:
        database = db
        only_save_dirty = True

    def to_dict(self):
        return model_to_dict(self, recurse=False)


def today_plus_loantime():
    return date.today() + timedelta(days=LOAN_WEEKS * 7)


class User(BaseModel):
    name = peewee.CharField()
    enabled = peewee.BooleanField(default=True)
    role = peewee.CharField(default="user")
    credit = peewee.FloatField(default=0)
    notes = peewee.TextField(null=True)
    informations = peewee.TextField(null=True)
    subscription = peewee.DateField(default=date.today)  # End of
    apikey = peewee.CharField(null=True)
    created_at = peewee.DateField(default=date.today)
    last_warning = peewee.DateField(null=True)
    lastseen = peewee.DateField(default=date.today)


class EMail(BaseModel):
    email = peewee.CharField(unique=True)
    user = peewee.ForeignKeyField(model=User)


class Item(BaseModel):
    name = peewee.CharField()
    enabled = peewee.BooleanField(default=True)
    description = peewee.TextField(null=True)
    players_min = peewee.IntegerField(null=True)
    players_max = peewee.IntegerField(null=True)
    gametime = peewee.IntegerField(null=True)
    age = peewee.IntegerField(null=True)
    big = peewee.BooleanField(default=False)
    outside = peewee.BooleanField(default=False)
    content = JSONField(null=True)
    pictures = JSONField(default=list)
    notes = peewee.TextField(null=True)
    lastseen = peewee.DateField(default=date.today)
    created_at = peewee.DateField(default=date.today)


class Category(BaseModel):
    name = peewee.CharField(unique=True)


class ItemCategory(BaseModel):
    item = peewee.ForeignKeyField(model=Item)
    category = peewee.ForeignKeyField(model=Category)

    class Meta:
        primary_key = peewee.CompositeKey("item", "category")


class ItemLink(BaseModel):
    item = peewee.ForeignKeyField(model=Item)
    name = peewee.CharField()
    ref = peewee.CharField()
    extra = JSONField(default={})
    refreshed_at = peewee.DateField(default=date.today)

    class Meta:
        primary_key = peewee.CompositeKey("item", "name")


class Loan(BaseModel):
    user = peewee.ForeignKeyField(model=User, null=True)
    item = peewee.ForeignKeyField(model=Item)
    start = peewee.DateField(default=date.today)
    stop = peewee.DateField(default=today_plus_loantime, index=True)
    status = peewee.CharField(default="out", index=True)
    extended = peewee.IntegerField(default=0)


class Booking(BaseModel):
    user = peewee.ForeignKeyField(model=User)
    item = peewee.ForeignKeyField(model=Item)
    created_at = peewee.DateField(default=date.today)
    start = peewee.DateField(default=date.today)


class Ledger(BaseModel):
    operator_id = peewee.ForeignKeyField(model=User, null=True)
    user = peewee.ForeignKeyField(model=User, null=True)  # Source of the transfer
    loan_id = peewee.ForeignKeyField(model=Loan, null=True)
    item_id = peewee.IntegerField(null=True)
    cost = peewee.FloatField()  # Cost of transaction
    money = peewee.FloatField()  # Physical money recevied
    day = peewee.DateField(default=date.today, index=True)
    created_at = peewee.DateTimeField(default=datetime.now)


class Rating(BaseModel):
    item = peewee.ForeignKeyField(model=Item)
    user = peewee.ForeignKeyField(model=User, null=True)
    source = peewee.CharField(default="website")
    weight = peewee.IntegerField(default=1)
    rating = peewee.FloatField()

    class Meta:
        indexes = ((("item", "source", "user"), True),)


class Log(BaseModel):
    user = peewee.ForeignKeyField(model=User, null=True)
    text = peewee.CharField(null=True)
    created_at = peewee.DateTimeField(default=datetime.now)
