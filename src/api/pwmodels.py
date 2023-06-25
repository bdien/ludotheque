import os
import datetime
import peewee


db = peewee.DatabaseProxy()
dbpath = os.getenv("LUDO_STORAGE", "../../storage").removesuffix("/")
db.initialize(
    peewee.SqliteDatabase(
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


class User(BaseModel):
    name = peewee.CharField()
    email = peewee.CharField(unique=True)
    role = peewee.CharField(default="user")
    credit = peewee.IntegerField(default=0)
    notes = peewee.TextField(null=True)
    created_time = peewee.DateTimeField(default=datetime.datetime.utcnow)


class Item(BaseModel):
    id = peewee.AutoField()
    name = peewee.CharField()
    description = peewee.TextField(null=True)
    players_min = peewee.IntegerField(null=True)
    players_max = peewee.IntegerField(null=True)
    gametime = peewee.IntegerField(null=True)
    age = peewee.IntegerField(null=True)
    big = peewee.BooleanField(default=False)
    outside = peewee.BooleanField(default=False)
    content = peewee.TextField(null=True)
    notes = peewee.TextField(null=True)
    created_time = peewee.DateTimeField(default=datetime.datetime.utcnow)


class Category(BaseModel):
    name = peewee.CharField(unique=True)


class ItemCategory(BaseModel):
    item = peewee.ForeignKeyField(model=Item)
    category = peewee.ForeignKeyField(model=Category)


class ItemLink(BaseModel):
    item = peewee.ForeignKeyField(model=Item)
    name = peewee.CharField()
    url = peewee.CharField()


class ItemPicture(BaseModel):
    item = peewee.ForeignKeyField(model=Item)
    index = peewee.IntegerField()
    filename = peewee.CharField()

    class Meta:
        primary_key = peewee.CompositeKey("item", "index")


class Loan(BaseModel):
    user = peewee.ForeignKeyField(model=User)
    item = peewee.ForeignKeyField(model=Item)
    start = peewee.DateField(default=datetime.date.today)
    stop = peewee.DateField()
    status = peewee.CharField()
