import re
import peewee
from api.pwmodels import Loan, User, db
from fastapi import APIRouter, HTTPException, Request, Depends
from api.system import auth_user, log_event

from playhouse.shortcuts import model_to_dict

router = APIRouter()


@router.post("/users", tags=["users"])
async def create_user(request: Request, auth=Depends(auth_user)):
    if not auth or auth.role not in ("admin", "benevole"):
        raise HTTPException(403)
    body = await request.json()

    # Avoid some properties
    params = {k: v for k, v in body.items() if k in User._meta.fields}
    params = {k: v for k, v in params.items() if k not in ("id", "created_at")}

    # Checks
    if not params:
        raise HTTPException(400, "Nothing to create")
    if not (0 <= int(params.get("credit", 0)) <= 100):
        raise HTTPException(400, "Invalid credit")

    with db:
        user = User.create(**params)
    log_event(auth, "user.create", target=user)
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
    log_event(auth, "user.modify", target_user=user_id)


@router.delete("/users/{user_id}", tags=["users"])
async def delete_user(user_id: int, auth=Depends(auth_user)):
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    with db:
        user = User.get_or_none(User.id == user_id)
        if not user:
            raise HTTPException(404)
        user.delete_instance(recursive=True)
        log_event(auth, "user.delete", target=user)
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
            .order_by(User.id)
            .limit(10)
            .dicts()
        )
