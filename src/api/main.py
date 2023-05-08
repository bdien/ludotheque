import logging
import peewee
from pwmodels import Item, Loan, User
from fastapi import FastAPI, HTTPException
from playhouse.shortcuts import model_to_dict

logging.basicConfig(level=logging.DEBUG)
app = FastAPI()

FAKE_USER = 1
FAKE_USER_ROLE = "operator"

@app.get("/items/{item_id}")
def get_item(item_id: int):

    # Retrieve item + status
    items = Item.select(Item, Loan).join(Loan, peewee.JOIN.LEFT_OUTER).where(Item.id == item_id).order_by(Loan.start).limit(1).execute()

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


@app.get("/loans")
def get_loans(all: str | None = None, user: str | None = None):

    if user is None:
        user = FAKE_USER

    loans = Loan.select().where(Loan.user==user)
    if all is None:
        loans = loans.where(Loan.status=="out")
    return list(loans.dicts())


@app.get("/me")
def get_user():

    user = User.get_by_id(FAKE_USER)
    ret = model_to_dict(user)
    ret["loans"] = list(Loan.select().where(Loan.user==user, Loan.status=="out").dicts())
    return ret