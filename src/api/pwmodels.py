import datetime
import peewee
from playhouse.db_url import connect


db = connect("sqliteext:///ludotheque.db", autoconnect=True)


def create_all_tables():
    db.create_tables([User, Item, ItemLink, Loan])


class BaseModel(peewee.Model):
    class Meta:
        database = db
        only_save_dirty = True


class User(BaseModel):
    name = peewee.CharField()
    email = peewee.CharField(null=True)
    role = peewee.CharField(default="user")
    credit = peewee.IntegerField(default=0)
    created_time = peewee.DateTimeField(default=datetime.datetime.utcnow)


class Item(BaseModel):
    id = peewee.AutoField()
    name = peewee.CharField()
    description = peewee.TextField(null=True)
    picture = peewee.CharField(null=True)
    players_min = peewee.IntegerField()
    players_max = peewee.IntegerField()
    age = peewee.IntegerField()
    big = peewee.BooleanField()
    outside = peewee.BooleanField()
    created_time = peewee.DateTimeField(default=datetime.datetime.utcnow)


class ItemLink(BaseModel):
    item = peewee.ForeignKeyField(model=Item)
    name = peewee.CharField()
    url = peewee.CharField()


class Loan(BaseModel):
    user = peewee.ForeignKeyField(model=User)
    item = peewee.ForeignKeyField(model=Item)
    start = peewee.DateField(default=datetime.date.today)
    stop = peewee.DateField()
    status = peewee.CharField()
