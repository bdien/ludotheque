import logging
import peewee
from pwmodels import Item, Loan, User
from fastapi import FastAPI, HTTPException, Request
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
        .order_by(Item.id.desc())
        .limit(7)
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


@app.get("/items/{item_id}")
def get_item(item_id: int):
    # Retrieve item + status
    items = (
        Item.select(Item, Loan)
        .join(Loan, peewee.JOIN.LEFT_OUTER)
        .where(Item.id == item_id)
        .order_by(Loan.start)
        .limit(1)
        .execute()
    )

    if items:
        item = items[0]
        base = model_to_dict(item)
        base["status"] = "in"
        if hasattr(item, "loan"):
            base["status"] = item.loan.status
            if base["status"] == "out":
                base["return"] = item.loan.stop
            if FAKE_USER_ROLE == "operator":
                base["last_loan"] = model_to_dict(item.loan, recurse=False)
        return base
    raise HTTPException(404)


@app.get("/items")
def get_items(nb: int = 0, sort: str | None = None):
    query = Item.select()
    if nb:
        query = query.limit(nb)
    return list(query.order_by(Item.id).dicts())


@app.get("/loans")
def get_loans(all: str | None = None, user: str | None = None):
    if user is None:
        user = FAKE_USER

    loans = Loan.select().where(Loan.user == user)
    if all is None:
        loans = loans.where(Loan.status == "out")
    return list(loans.dicts())


@app.get("/users/{user_id}")
def get_user(user_id: int):
    user = User.get_or_none(user_id)
    if not user:
        raise HTTPException(404)
    return model_to_dict(user)


@app.get("/users")
def get_users():
    return list(User.select(User.id, User.name).dicts())


@app.get("/users/qsearch/{txt}")
def qsearch_user(txt: str):
    return list(
        User.select(User.id, User.name)
        .where((User.name ** f"%{txt}%") | (User.id ** f"%{txt}%"))
        .order_by(User.id.desc())
        .limit(7)
        .dicts()
    )


@app.get("/me")
def get_myself():
    user = User.get_by_id(FAKE_USER)
    ret = model_to_dict(user)
    ret["loans"] = list(
        Loan.select()
        .where(Loan.user == user, Loan.status == "out")
        .order_by(Loan.start)
        .dicts()
    )
    return ret
