import csv
import datetime
import io
import logging
import pathlib
import re
from typing import Annotated

import jinja2
import peewee
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import PlainTextResponse
from playhouse.shortcuts import model_to_dict
from pydantic import BaseModel

from api.config import EMAIL_MINPERIOD
from api.pwmodels import Booking, EMail, Item, Loan, User, db
from api.system import AuthUser, auth_user, check_auth, log_event, send_email

router = APIRouter()


@router.post("/users", tags=["users"])
async def create_user(request: Request, auth=Depends(auth_user)):
    check_auth(auth, "admin")
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

            log_event(auth, f"Adhérent '{user.name}' ({user.id}) créé")

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


def uniquesplit(lst: str | None) -> list:
    if not lst:
        return []
    return list(set(lst.split(",")))


@router.get("/users", tags=["users"])
def get_users(
    nb: int = 0, sort: str | None = None, q: str | None = None, auth=Depends(auth_user)
):
    check_auth(auth, "benevole")

    query = (
        User.select(
            User.id,
            User.name,
            User.enabled,
            User.subscription,
            User.credit,
            User.role,
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
        ret = []
        for user in query.order_by(User.name):
            elem = model_to_dict(user) | {
                "loans": user.loans / max(1, len(uniquesplit(user.emails))),
                "oldest_loan": user.oldest_loan,
                "emails": uniquesplit(user.emails),
            }
            if auth.role != "admin":
                del elem["emails"]
            ret.append(elem)
        return ret


@router.get("/users/export", tags=["users"], response_class=PlainTextResponse)
def export_users(auth=Depends(auth_user)):
    "Export CSV"

    check_auth(auth, "admin")
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


@router.get("/users/me", tags=["user"])
def get_myself(auth=Depends(auth_user)):
    if not auth:
        return {}
    return {"role": auth.role, "id": auth.id}


@router.get("/users/search", tags=["users"])
def search_user(q: str | None = None, auth=Depends(auth_user)):
    check_auth(auth, "benevole")
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


@router.get("/users/{user_id}", tags=["user"])
def get_user(user_id: int, auth=Depends(auth_user)):
    # Must be authenticated. If not checking self, must be at least benevole
    check_auth(auth)
    if user_id != auth.id:
        check_auth(auth, "benevole")

    with db:
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

        # Loans
        ret["loans"] = list(
            Loan.select()
            .where(Loan.user == user, Loan.status == "out")
            .order_by(Loan.stop)
            .dicts()
        )

        # Bookings
        ret["bookings"] = list(
            Booking.select()
            .where(Booking.user == user)
            .order_by(Booking.created_at)
            .dicts()
        )

    if auth.role not in ("admin", "benevole"):
        del ret["notes"]
    if auth.role != "admin":
        del ret["informations"]
        del ret["apikey"]
        del ret["last_warning"]
        if user_id != auth.id:
            del ret["emails"]

    return ret


class LoanHistoryItem(BaseModel):
    id: int
    start: datetime.date
    stop: datetime.date
    item: int
    name: str


@router.get("/users/{user_id}/history", tags=["user"])
def get_user_history(user_id: int, auth=Depends(auth_user)) -> list[LoanHistoryItem]:
    # Must be authenticated. If not checking self, must be at least admin
    check_auth(auth)
    if user_id != auth.id:
        check_auth(auth, "admin")

    with db:
        return list(
            Loan.select(Loan.id, Loan.start, Loan.stop, Loan.item, Item.name)
            .where(Loan.user_id == user_id, Loan.status == "in")
            .join(Item)
            .order_by(Loan.stop.desc())
            .dicts()
        )


@router.post("/users/{user_id}", tags=["user"])
async def modify_user(
    user_id: int, request: Request, auth: Annotated[AuthUser, Depends(auth_user)]
):
    check_auth(auth, "admin")
    body = await request.json()

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

        log_event(auth, f"Adhérent '{params['name']}' ({user_id}) modifié")

    return {"id": user_id}


@router.delete("/users/{user_id}", tags=["user"])
async def delete_user(user_id: int, auth: Annotated[AuthUser, Depends(auth_user)]):
    check_auth(auth, "admin")
    with db:
        user = User.get_or_none(User.id == user_id)
        if not user:
            raise HTTPException(404)
        user.delete_instance(recursive=True)
        log_event(auth, f"Adhérent '{user.name}' ({user.id}) supprimé")
        return "OK"


def plural(lst, plural="s", singular="") -> str:
    return singular if len(lst) == 1 else plural


def shortDate(d: datetime.date):
    fmt = "%d %B %Y" if d.year != datetime.date.today().year else "%d %B"
    return d.strftime(fmt).lstrip("0")


@router.get("/users/{user_id}/email", tags=["user"])
def send_user_email(
    user_id: int,
    auth: Annotated[AuthUser, Depends(auth_user)],
    send: bool | None = False,
):
    check_auth(auth, "admin")
    with db:
        user = User.get_or_none(User.id == user_id)
        if not user:
            raise HTTPException(400, "No such user")
        if (
            user.last_warning
            and (datetime.date.today() - user.last_warning).days < EMAIL_MINPERIOD
        ):
            raise HTTPException(400, "Too frequent emails")

        emails = [i.email for i in EMail.select().where(EMail.user == user_id)]
        if not emails:
            raise HTTPException(400, "No emails")

        loans = (
            Loan.select(Loan.stop, Item.name, Item.id)
            .join(Item)
            .where(
                Loan.status == "out",
                Loan.stop < datetime.date.today(),
                Loan.user == user_id,
            )
            .order_by(Loan.stop, Loan.user)
        )
        nb = len(loans)
        if not nb:
            raise HTTPException(400, "No late loan")

        # Render email
        env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(pathlib.Path(__file__).parent / "templates"),
            autoescape=True,
        )
        env.filters.update({"plural": plural, "shortdate": shortDate})
        txt = env.get_template("email_retard.txt").render(loans=loans)
        txt = txt.replace("\n", "<br/>")

        # Send email
        result = {"title": "Jeux en retard", "body": txt, "to": emails, "sent": False}
        if send:
            result |= send_email(result["to"], result["title"], result["body"])

        # Update last warning date
        if result["sent"]:
            user.last_warning = datetime.date.today()
            user.save()

        log_event(auth, f"Email envoyé à '{user.name}' ({user.id})")

        return result
