import io
import csv
import logging
import re
from fastapi.responses import PlainTextResponse
import peewee
from api.pwmodels import Loan, User, EMail, db
from fastapi import APIRouter, HTTPException, Request, Depends
from api.system import auth_user

from playhouse.shortcuts import model_to_dict

router = APIRouter()


@router.post("/users", tags=["users"])
async def create_user(request: Request, auth=Depends(auth_user)):
    if not auth or auth.role not in ("admin", "benevole"):
        raise HTTPException(403)
    body = await request.json()

    # Lowercase emails
    emails = [i.lower() for i in body.get("emails", [])]

    # Keep only model properties (And remove some internals)
    params = {k: v for k, v in body.items() if k in User._meta.fields}
    params = {k: v for k, v in params.items() if k not in ("created_at", "id")}

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
                next_id = next(idx for idx, val in enumerate(used_ids, 1) if idx != val)
                params["id"] = next_id

            # Create user
            user = User.create(**params)

            # Create emails
            for email in emails:
                EMail.create(email=email, user=user)

        except peewee.IntegrityError as e:
            if e.args[0] == "UNIQUE constraint failed: email.email":
                raise HTTPException(500, "L'email est vide ou déjà utilisé") from None
            logging.exception("Create user")
            raise HTTPException(500, str(e)) from None

    return model_to_dict(user)


def re_acc(txt):
    "Remove accents"
    for r in ("[éèëe]", "[aà]", "[cç]", "[uù]", "[îiï]"):
        txt = re.sub(r, r, txt)
    return txt


def uniquesplit(lst: list | None) -> list:
    if not lst:
        return []
    return list(set(lst.split(",")))


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
            peewee.fn.group_concat(EMail.email).alias("emails"),
        )
        .left_outer_join(EMail)
        .switch()
        .left_outer_join(Loan, on=((Loan.user == User.id) & (Loan.status == "out")))
        .group_by(User.id)
    )

    if nb:
        query = query.limit(nb)
    if q:
        query = query.where(User.name.regexp(re_acc(q)) | (EMail.email ** f"%{q}%"))

    with db:
        # Combine fields. Note: We must divide the number of loans per the number of
        # emails because of grouping
        return [
            model_to_dict(user)
            | {
                "loans": user.loans / max(1, len(uniquesplit(user.emails))),
                "oldest_loan": user.oldest_loan,
                "emails": uniquesplit(user.emails),
            }
            for user in query.order_by(User.name)
        ]


@router.get("/users/export", tags=["users"], response_class=PlainTextResponse)
def export_users(auth=Depends(auth_user)):
    "Export CSV"
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    f = io.StringIO()
    csvwriter = csv.DictWriter(
        f,
        ["id", "name", "enabled", "role", "subscription", "created_at"],
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
        if u := User.select(User.id, User.role).where(User.id == auth.id).get():
            ret = model_to_dict(u, recurse=False)
            del ret["notes"]  # Private to admins
            del ret["informations"]  # Private to admins
            return ret
    raise HTTPException(402)


@router.get("/users/search", tags=["users"])
def search_user(q: str | None = None, auth=Depends(auth_user)):
    if not auth or auth.role not in ("admin", "benevole"):
        raise HTTPException(403)

    if not q:
        return []

    with db:
        return list(
            User.select(User.id, User.name)
            .where(User.name.regexp(re_acc(q)) | (User.id ** f"%{q}%"))
            .where(User.enabled)
            .order_by(User.name)
            .limit(10)
            .dicts()
        )


@router.get("/users/{user_id}", tags=["users"])
def get_user(user_id: int, short: bool | None = False, auth=Depends(auth_user)):
    if (not auth) or (auth.role not in ("admin", "benevole") and (user_id != auth.id)):
        raise HTTPException(403)

    with db:
        if short:
            user = User.get_by_id(user_id)
            return {"id": user_id, "name": user.name, "role": user.role}

        user = (
            User.select(User, EMail.email)
            .left_outer_join(EMail)
            .where(User.id == user_id)
            .group_by(User.id)
            .get()
        )
        if not user:
            raise HTTPException(404)
        ret = model_to_dict(user, recurse=False)
        ret["emails"] = [i.email for i in user.email_set]
        ret["loans"] = list(
            Loan.select()
            .where(Loan.user == user, Loan.status == "out")
            .order_by(Loan.stop)
            .dicts()
        )

    if auth.role not in ("admin", "benevole"):
        del ret["notes"]
    if auth.role != "admin":
        del ret["informations"]
        del ret["apikey"]

    return ret


@router.post("/users/{user_id}", tags=["users"])
async def modify_user(user_id: int, request: Request, auth=Depends(auth_user)):
    if not auth or auth.role not in ("admin", "benevole"):
        raise HTTPException(403)

    body = await request.json()

    # Prevent benevole from changing any role
    if (auth.role == "benevole") and ("role" in body):
        del body["role"]

    # Lowercase emails
    emails = [i.lower() for i in body.get("emails", [])]

    # Keep only model properties (And remove some internals)
    params = {k: v for k, v in body.items() if k in User._meta.fields}
    params = {k: v for k, v in params.items() if k not in ("id", "created_at")}

    # Checks
    if not params:
        raise HTTPException(400, "Nothing to update")
    if not (0 <= float(params.get("credit", 0)) <= 100):
        raise HTTPException(400, "Invalid credit")

    with db:
        User.update(**params).where(User.id == user_id).execute()

        # Update emails
        EMail.delete().where(
            EMail.user == user_id, EMail.email.not_in(emails)
        ).execute()
        for email in emails:
            EMail.insert(email=email, user=user_id).on_conflict_ignore().execute()


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
