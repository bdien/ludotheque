import datetime
import mimetypes
import logging
import os
import shutil
import peewee
from api.pwmodels import Item, Loan, User, db
from fastapi import FastAPI, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from playhouse.shortcuts import model_to_dict


logging.basicConfig(level=logging.DEBUG)
app = FastAPI(root_path="/api")
app.add_middleware(CORSMiddleware, allow_origins="*")
app.add_middleware(GZipMiddleware, minimum_size=1000)

FAKE_USER = 1
FAKE_USER_ROLE = "operator"  # Could be user, operator, admin

LOAN_COST = 0.5
LOAN_TIME_DAYS = 7 * 3

LUDO_STORAGE = os.getenv("LUDO_STORAGE", "../../storage").removesuffix("/")


@app.get("/items/qsearch/{txt}")
def qsearch_item(txt: str):
    return list(
        Item.select(Item.id, Item.name)
        .where((Item.name ** f"%{txt}%") | (Item.id ** f"%{txt}%"))
        .order_by(Item.id)
        .limit(10)
        .dicts()
    )


@app.post("/items")
async def create_item(request: Request):
    body = await request.json()

    # Limit to selected properties
    create_params = {
        k: v
        for k, v in body.items()
        if k
        in (
            "name",
            "description",
            "age",
            "players_min",
            "players_max",
            "big",
            "outside",
        )
    }

    item = Item.create(**create_params)
    return model_to_dict(item)


@app.post("/items/{item_id}")
async def modify_item(item_id: int, request: Request):
    body = await request.json()

    # Limit to selected properties
    update_params = {
        k: v
        for k, v in body.items()
        if k
        in (
            "name",
            "description",
            "age",
            "players_min",
            "players_max",
            "big",
            "outside",
        )
    }

    Item.update(**update_params).where(Item.id == item_id).execute()


@app.post("/items/{item_id}/picture")
async def modify_item_picture(item_id: int, file: UploadFile):
    # Save new image to disk
    extension = mimetypes.guess_extension(file.content_type, strict=False)
    filename = f"jeu_{item_id:05d}{extension}"
    with open(f"{LUDO_STORAGE}/img/{filename}", "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    # Delete previous image and set new one in DB
    item = Item.get_by_id(item_id)
    if item.picture and item.picture != filename:
        print(f"Unlink {LUDO_STORAGE}/img/{item.picture}")
        os.unlink(f"{LUDO_STORAGE}/img/{item.picture}")
    item.picture = filename
    item.save()


@app.delete("/items/{item_id}/picture")
def delete_item_picture(item_id: int):
    item = Item.get_by_id(item_id)
    if item.picture:
        os.unlink(f"{LUDO_STORAGE}/img/{item.picture}")
    item.picture = None
    item.save()


@app.get("/items/{item_id}")
def get_item(item_id: int, history: int | None = 10):
    if FAKE_USER_ROLE == "user":
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
        base = model_to_dict(item, recurse=False)
        loans = [i.loan for i in items] if hasattr(item, "loan") else []
        base["status"] = "in"
        if loans:
            base["status"] = loans[0].status
            base["return"] = loans[0].stop
            if FAKE_USER_ROLE in ("operator", "admin"):
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
    for i in "user", "items", "cost":
        if i not in body:
            raise HTTPException(400, f"Missing parameter '{i}'")

    user = User.get_or_none(User.id == body["user"])
    if not user:
        raise HTTPException(400, "No such user")

    items = [Item.get_or_none(Item.id == i) for i in body["items"]]
    if not all(items):
        raise HTTPException(400, "Cannot find some items")

    topay_fromcredit = min(body["cost"], user.credit)

    with db.transaction():
        today = datetime.date.today()

        # For each item, forget any other loan and create a new one
        for i in items:
            Loan.update({"status": "in", "stop": today}).where(
                Loan.id == i, Loan.status == "out"
            ).execute()

            Loan.create(
                user=user,
                item=i,
                start=today,
                stop=today + datetime.timedelta(days=LOAN_TIME_DAYS),
                status="out",
            )

        # Update user credit
        if topay_fromcredit:
            user.credit -= topay_fromcredit
            user.save()

    return "OK"


@app.get("/loans/{loan_id}")
def get_loan(loan_id: int):
    if loan := Loan.get_or_none(loan_id):
        return model_to_dict(loan, recurse=False)
    raise HTTPException(404)


@app.get("/loans/{loan_id}/close")
def close_loan(loan_id: int):
    loan = Loan.get_or_none(Loan.id == loan_id)
    if not loan:
        raise HTTPException(400, "No such loan")
    if loan.status != "out":
        raise HTTPException(400, "Already closed")

    loan.stop = datetime.date.today()
    loan.status = "in"
    loan.save()
    return model_to_dict(loan, recurse=False)


@app.post("/users")
async def create_user(request: Request):
    body = await request.json()

    # Limit to selected properties
    create_params = {
        k: v for k, v in body.items() if k in ("name", "email", "role", "credit")
    }

    user = User.create(**create_params)
    return model_to_dict(user)


@app.post("/users/{user_id}")
async def modify_user(user_id: int, request: Request):
    body = await request.json()

    # Limit to selected properties
    update_params = {
        k: v for k, v in body.items() if k in ("name", "email", "role", "credit")
    }

    User.update(**update_params).where(User.id == user_id).execute()


@app.get("/users/{user_id}")
def get_user(user_id: int):
    if FAKE_USER_ROLE in ("operator", "admin"):
        HTTPException(403)

    user = User.get_or_none(user_id)
    if not user:
        raise HTTPException(404)
    ret = model_to_dict(user, recurse=False)
    ret["loans"] = list(
        Loan.select()
        .where(Loan.user == user, Loan.status == "out")
        .order_by(Loan.stop)
        .dicts()
    )
    return ret


@app.get("/users")
def get_users(nb: int = 0, sort: str | None = None, q: str | None = None):
    if FAKE_USER_ROLE in ("operator", "admin"):
        HTTPException(403)

    query = (
        User.select(
            User,
            peewee.fn.Count(Loan).alias("loans"),
            peewee.fn.Min(Loan.stop).alias("oldest_loan"),
        )
        .join(
            Loan,
            peewee.JOIN.LEFT_OUTER,
            on=((Loan.user == User.id) & (Loan.status == "out")),
        )
        .group_by(User.id)
    )

    if nb:
        query = query.limit(nb)
    if q:
        query = query.where((User.name ** f"%{q}%") | (User.email ** f"%{q}%"))

    return list(query.order_by(User.id).dicts())


@app.get("/users/qsearch/{txt}")
def qsearch_user(txt: str):
    if FAKE_USER_ROLE in ("operator", "admin"):
        HTTPException(403)
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
        return model_to_dict(user, recurse=False)
    raise HTTPException(402)
