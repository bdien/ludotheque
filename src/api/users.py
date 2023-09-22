import io
import csv
import logging
import re
from fastapi.responses import PlainTextResponse
import peewee
from api.pwmodels import Loan, User, db
from fastapi import APIRouter, HTTPException, Request, Depends
from api.system import auth_user

from playhouse.shortcuts import model_to_dict

router = APIRouter()


@router.post("/users", tags=["users"])
async def create_user(request: Request, auth=Depends(auth_user)):
    if not auth or auth.role not in ("admin", "benevole"):
        raise HTTPException(403)
    body = await request.json()

    # Avoid some properties
    params = {k: v for k, v in body.items() if k in User._meta.fields}
    params = {k: v for k, v in params.items() if k not in ("created_at",)}
    # Remove ID = None or ""
    if ("id" in params) and not params["id"]:
        del params["id"]

    # Checks
    if not params:
        raise HTTPException(400, "Nothing to create")
    if not (0 <= int(params.get("credit", 0)) <= 100):
        raise HTTPException(400, "Invalid credit")

    with db:
        try:
            # For users, try to find the lowest unused value (Starting from 1)
            if not params.get("id"):
                used_ids = [*sorted(i.id for i in User.select(User.id)), None]
                print(used_ids)
                next_id = next(idx for idx, val in enumerate(used_ids, 1) if idx != val)
                params["id"] = next_id

            print(params)
            user = User.create(**params)
        except peewee.IntegrityError as e:
            if e.args[0] == "UNIQUE constraint failed: user.id":
                raise HTTPException(
                    500, f"Le numéro '{params['id']}' est déjà utilisé"
                ) from None
            if e.args[0] == "UNIQUE constraint failed: user.email":
                raise HTTPException(500, "L'email est vide ou déjà utilisé") from None
            logging.exception("Create user")
            raise HTTPException(500, str(e)) from None

    return model_to_dict(user)


@router.get("/users", tags=["users"])
def get_users(
    nb: int = 0, sort: str | None = None, q: str | None = None, auth=Depends(auth_user)
):
    if not auth or auth.role not in ("admin", "benevole"):
        raise HTTPException(403)

    query = (
        User.select(
            User,
            peewee.fn.Count(Loan.id).alias("loans"),
            peewee.fn.Min(Loan.stop).alias("oldest_loan"),
        )
        .left_outer_join(Loan, on=((Loan.user == User.id) & (Loan.status == "out")))
        .group_by(User.id)
    )

    if nb:
        query = query.limit(nb)
    if q:
        query = query.where((User.name ** f"%{q}%") | (User.email ** f"%{q}%"))

    with db:
        return list(query.order_by(User.name).dicts())


@router.get("/users/export", tags=["users"], response_class=PlainTextResponse)
def export_users(auth=Depends(auth_user)):
    "Export CSV"
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    f = io.StringIO()
    csvwriter = csv.DictWriter(
        f,
        ["id", "name", "email", "enabled", "role", "subscription", "created_at"],
        extrasaction="ignore",
        delimiter=";",
    )
    csvwriter.writeheader()
    with db:
        for u in User.select().dicts():
            csvwriter.writerow(u)
        return f.getvalue()


@router.get("/users/me", tags=["users"])
def get_myself(auth=Depends(auth_user)):
    if not auth:
        raise HTTPException(401)
    with db:
        if u := User.get_or_none(User.id == auth.id):
            ret = model_to_dict(u, recurse=False)
            del ret["notes"]  # Private to admins
            del ret["informations"]  # Private to admins
            return ret
    raise HTTPException(402)


@router.get("/users/{user_id}", tags=["users"])
def get_user(user_id: int, auth=Depends(auth_user)):
    if (not auth) or (auth.role not in ("admin", "benevole") and (user_id != auth.id)):
        raise HTTPException(403)

    with db:
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

    if auth.role not in ("admin", "benevole"):
        del ret["notes"]
        del ret["apikey"]
    if auth.role != "admin":
        del ret["informations"]

    return ret


@router.post("/users/{user_id}", tags=["users"])
async def modify_user(user_id: int, request: Request, auth=Depends(auth_user)):
    if not auth or auth.role not in ("admin", "benevole"):
        raise HTTPException(403)

    body = await request.json()

    # Prevent benevole from changing any role
    if (auth.role == "benevole") and ("role" in body):
        del body["role"]

    # Avoid some properties
    params = {k: v for k, v in body.items() if k in User._meta.fields}
    params = {k: v for k, v in params.items() if k not in ("id", "created_at")}

    # Checks
    if not params:
        raise HTTPException(400, "Nothing to update")
    if not (0 <= float(params.get("credit", 0)) <= 100):
        raise HTTPException(400, "Invalid credit")

    with db:
        User.update(**params).where(User.id == user_id).execute()


@router.delete("/users/{user_id}", tags=["users"])
async def delete_user(user_id: int, auth=Depends(auth_user)):
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    with db:
        user = User.get_or_none(User.id == user_id)
        if not user:
            raise HTTPException(404)
        user.delete_instance(recursive=True)
        return "OK"


@router.get("/users/qsearch/{txt}", tags=["users"])
def qsearch_user(txt: str, auth=Depends(auth_user)):
    if not auth or auth.role not in ("admin", "benevole"):
        raise HTTPException(403)

    # Replace accents
    txt = re.sub("[eéèaàcçuùîiï]", "_", txt)

    with db:
        return list(
            User.select(User.id, User.name)
            .where((User.name ** f"%{txt}%") | (User.id ** f"%{txt}%"))
            .order_by(User.name)
            .limit(10)
            .dicts()
        )
