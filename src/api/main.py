import datetime
import mimetypes
import logging
import os
import shutil
import peewee
from pwmodels import Item, Loan, User, db
from fastapi import FastAPI, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from playhouse.shortcuts import model_to_dict


logging.basicConfig(level=logging.DEBUG)
app = FastAPI(root_path="/api")
app.add_middleware(CORSMiddleware, allow_origins="*")
app.add_middleware(GZipMiddleware, minimum_size=1000)

FAKE_USER = 1
FAKE_USER_ROLE = "operator"


@app.get("/items/qsearch/{txt}")
def qsearch_item(txt: str):
    return list(
        Item.select(Item.id, Item.name)
        .where((Item.name ** f"%{txt}%") | (Item.id ** f"%{txt}%"))
        .order_by(Item.id)
        .limit(10)
        .dicts()
    )


@app.post("/items/{item_id}")
async def modify_item(item_id: int, request: Request):
    body = await request.json()

    # Limit to selected properties
    update_params = {
        k: v
        for k, v in body.items()
        if k in ["name", "description", "age", "players_min", "players_max"]
    }

    Item.update(**update_params).where(Item.id == item_id).execute()


@app.post("/items/{item_id}/picture")
async def modify_item_picture(item_id: int, file: UploadFile):
    # Save new image to disk
    extension = mimetypes.guess_extension(file.content_type, strict=False)
    filename = f"jeu_{item_id:05d}{extension}"
    with open(f"img/{filename}", "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    # Delete previous image and set new one in DB
    item = Item.get_by_id(item_id)
    if item.picture and item.picture != filename:
        print(f"Unlink img/{item.picture}")
        os.unlink(f"img/{item.picture}")
    item.picture = filename
    item.save()


@app.delete("/items/{item_id}/picture")
def delete_item_picture(item_id: int):
    item = Item.get_by_id(item_id)
    if item.picture:
        os.unlink(f"img/{item.picture}")
    item.picture = None
    item.save()


@app.get("/items/{item_id}")
def get_item(item_id: int, history: int | None = 10):
    if FAKE_USER_ROLE != "operator":
        history = 1

    # Retrieve item + status
    items = (
        Item.select(Item, Loan)
        .join(Loan, peewee.JOIN.LEFT_OUTER)
        .where(Item.id == item_id)
        .order_by(-Loan.stop)
        .limit(history)
        .execute()
    )

    if items:
        item = items[0]
        base = model_to_dict(item)
        loans = [i.loan for i in items] if hasattr(item, "loan") else []
        base["status"] = "in"
        if loans:
            base["status"] = loans[0].status
            base["return"] = loans[0].stop
            if FAKE_USER_ROLE == "operator":
                base["loans"] = [model_to_dict(i, recurse=False) for i in loans]
        return base
    raise HTTPException(404)


@app.get("/items")
def get_items(nb: int = 0, sort: str | None = None, q: str | None = None):
    query = Item.select()
    if nb:
        query = query.limit(nb)
    if q:
        query = query.where((Item.name ** f"%{q}%") | (Item.id ** f"%{q}%"))
    return list(query.order_by(Item.id).dicts())


@app.get("/loans")
def get_loans(all: str | None = None, user: str | None = None):
    if user is None:
        user = FAKE_USER

    loans = Loan.select().where(Loan.user == user)
    if all is None:
        loans = loans.where(Loan.status == "out")
    return list(loans.dicts())


@app.post("/loans")
async def create_loan(request: Request):
    body = await request.json()
    if ("user" not in body) or ("items" not in body):
        raise HTTPException(400, "Missing parameters")

    user = User.get_or_none(User.id == body["user"])
    if not user:
        raise HTTPException(400, "No such user")

    items = [Item.get_or_none(Item.id == i) for i in body["items"]]
    if not all(items):
        raise HTTPException(400, "Cannot find some items")

    topay = len(items) * 0.5
    topay_fromcredit = min(topay, user.credit)
    user.credit -= topay_fromcredit

    with db.transaction():
        today = datetime.date.today()
        for i in items:
            Loan.create(
                user=user,
                item=i,
                start=today,
                stop=today + datetime.timedelta(days=7 * 3),
                status="out",
            )

        user.save()
    return "OK"


@app.get("/users/{user_id}")
def get_user(user_id: int):
    user = User.get_or_none(user_id)
    if not user:
        raise HTTPException(404)
    ret = model_to_dict(user)
    ret["loans"] = list(
        Loan.select()
        .where(Loan.user == user, Loan.status == "out")
        .order_by(Loan.stop)
        .dicts()
    )
    return ret


@app.get("/users")
def get_users():
    return list(
        User.select(
            User,
            peewee.fn.Count(Loan).alias("loans"),
            peewee.fn.Min(Loan.stop).alias("oldest_loan"),
        )
        .join(Loan, peewee.JOIN.LEFT_OUTER)
        .where(Loan.status == "out")
        .dicts()
    )


@app.get("/users/qsearch/{txt}")
def qsearch_user(txt: str):
    return list(
        User.select(User.id, User.name)
        .where((User.name ** f"%{txt}%") | (User.id ** f"%{txt}%"))
        .order_by(User.id)
        .limit(10)
        .dicts()
    )


@app.get("/me")
def get_myself():
    if user := User.get_or_none(User.id == FAKE_USER):
        return model_to_dict(user)
    raise HTTPException(402)
