import os
from datetime import date, timedelta
import peewee
from playhouse.sqlite_ext import SqliteExtDatabase, JSONField
from api.config import LOAN_DAYS

db = peewee.DatabaseProxy()
dbpath = os.getenv("LUDO_STORAGE", "../../storage").removesuffix("/")
db.initialize(
    SqliteExtDatabase(
        f"{dbpath}/ludotheque.db", pragmas={"foreign_keys": 1, "journal_mode": "wal"}
    )
)


def create_all_tables(drop=False):
    if drop:
        db.drop_tables(
            [User, Item, ItemLink, Category, ItemCategory, ItemPicture, Loan]
        )
    db.create_tables([User, Item, ItemLink, Category, ItemCategory, ItemPicture, Loan])


class BaseModel(peewee.Model):
    class Meta:
        database = db
        only_save_dirty = True


def today_plus_1y():
    return date.today() + timedelta(days=365)


def today_plus_loantime():
    return date.today() + timedelta(days=LOAN_DAYS)


class User(BaseModel):
    name = peewee.CharField()
    enabled = peewee.BooleanField(default=True)
    email = peewee.CharField(unique=True)
    role = peewee.CharField(default="user")
    credit = peewee.FloatField(default=0)
    notes = peewee.TextField(null=True)
    subscription = peewee.DateField(default=today_plus_1y)  # End of
    apikey = peewee.CharField(null=True)
    created_at = peewee.DateField(default=date.today)


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
    notes = peewee.TextField(null=True)
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

    class Meta:
        primary_key = peewee.CompositeKey("item", "name")


class ItemPicture(BaseModel):
    item = peewee.ForeignKeyField(model=Item)
    index = peewee.IntegerField()
    filename = peewee.CharField()

    class Meta:
        primary_key = peewee.CompositeKey("item", "index")


class Loan(BaseModel):
    user = peewee.ForeignKeyField(model=User)
    item = peewee.ForeignKeyField(model=Item)
    cost = peewee.FloatField()
    start = peewee.DateField(default=date.today)
    stop = peewee.DateField(default=today_plus_loantime, index=True)
    status = peewee.CharField(default="out", index=True)
