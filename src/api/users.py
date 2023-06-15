import re
import peewee
from api.pwmodels import Loan, User
from fastapi import APIRouter, HTTPException, Request
from playhouse.shortcuts import model_to_dict

FAKE_USER = 1
FAKE_USER_ROLE = "operator"  # Could be user, operator, admin
router = APIRouter()


@router.post("/users", tags=["users"])
async def create_user(request: Request):
    body = await request.json()

    # Limit to selected properties
    create_params = {
        k: v for k, v in body.items() if k in ("name", "email", "role", "credit")
    }

    user = User.create(**create_params)
    return model_to_dict(user)


@router.get("/users", tags=["users"])
def get_users(nb: int = 0, sort: str | None = None, q: str | None = None):
    if FAKE_USER_ROLE in ("operator", "admin"):
        HTTPException(403)

    query = (
        User.select(
            User,
            peewee.fn.Count(Loan.id).alias("loans"),
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


@router.get("/users/me", tags=["users"])
def get_myself():
    if user := User.get_or_none(User.id == FAKE_USER):
        return model_to_dict(user, recurse=False)
    raise HTTPException(402)


@router.get("/users/{user_id}", tags=["users"])
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


@router.post("/users/{user_id}", tags=["users"])
async def modify_user(user_id: int, request: Request):
    body = await request.json()

    # Limit to selected properties
    update_params = {
        k: v for k, v in body.items() if k in ("name", "email", "role", "credit")
    }

    User.update(**update_params).where(User.id == user_id).execute()


@router.delete("/users/{user_id}", tags=["users"])
async def delete_user(user_id: int):
    if FAKE_USER_ROLE in ("operator", "admin"):
        HTTPException(403)

    user = User.get_or_none(User.id == user_id)
    if not user:
        raise HTTPException(404)
    user.delete_instance(recursive=True)
    return "OK"


@router.get("/users/qsearch/{txt}", tags=["users"])
def qsearch_user(txt: str):
    if FAKE_USER_ROLE in ("operator", "admin"):
        HTTPException(403)

    # Replace accents
    txt = re.sub("[eéèaàcçuù]", "_", txt)

    return list(
        User.select(User.id, User.name)
        .where((User.name ** f"%{txt}%") | (User.id ** f"%{txt}%"))
        .order_by(User.id)
        .limit(10)
        .dicts()
    )
