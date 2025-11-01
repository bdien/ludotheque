import dataclasses
import datetime
import logging
import os
import smtplib
import tarfile
import tempfile
from email.mime.text import MIMEText
from typing import Annotated

import cachetools.func
import requests
from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import FileResponse
from jours_feries_france import JoursFeries
from starlette.background import BackgroundTask
from vacances_scolaires_france import SchoolHolidayDates

import api.gsheets
from api import config
from api.pwmodels import EMail, Item, Loan, Log, User, db

router = APIRouter()
stats_cache = {}


@dataclasses.dataclass(frozen=True)
class AuthUser:
    id: int
    role: str


def __validate_token(authorization: str) -> str | None:
    "Validate token, fetch user info and extract email"
    r = requests.get(
        f"https://{config.AUTH_DOMAIN}/userinfo",
        headers={"Authorization": authorization},
        timeout=60,
    )
    if r.status_code != 200:
        logging.warning("Unable to validate token")
        return None
    return r.json().get("email")


@cachetools.func.ttl_cache(ttl=600)
def auth_user(authorization: Annotated[str | None, Header()] = None) -> AuthUser | None:
    "Authenticate the user and return id/email/role"
    if (not authorization) or (not authorization.lower().startswith("bearer")):
        return None

    # API-Key ?
    user = None
    if f" {config.APIKEY_PREFIX}" in authorization.lower():
        with db:
            # Remove Bearer
            apikey = authorization.split(" ", 1)[1]
            try:
                user = (
                    User.select(User.id, User.role)
                    .where(User.apikey == apikey, User.enabled)
                    .get()
                )
            except User.DoesNotExist:
                logging.warning("Cannot find user in DB with APIKey")
                return None

    # Validate token and extract email
    if not user:
        email = __validate_token(authorization)
        if not email:
            logging.warning("Invalid token")
            return None

        # Look into DB
        with db:
            try:
                user = (
                    User.select(User.id, User.role)
                    .join(EMail)
                    .where(EMail.email == email, User.enabled)
                    .get()
                )
            except User.DoesNotExist:
                logging.warning("Cannot find email '%s' in DB", email)
                return None

    # Role benevole is only valid on saturdays 10h->13h
    now = datetime.datetime.now()
    if user.role == "benevole" and not (now.weekday() == 5 and (10 <= now.hour <= 12)):
        user.role = "user"

    return AuthUser(user.id, user.role)


def check_auth(auth: AuthUser, minlevel: str = "user") -> None:
    "Check that the user is authenticated and at minimum level, throw exception"

    if not auth:
        raise HTTPException(401)

    if (minlevel == "admin") and (auth.role != "admin"):
        raise HTTPException(403)
    if (minlevel == "benevole") and (auth.role not in ("admin", "benevole")):
        raise HTTPException(403)


@router.get("/backup")
def create_backup(auth=Depends(auth_user)):
    "Create a TAR file with the DB and images"

    check_auth(auth, "admin")
    storage_path = os.getenv("LUDO_STORAGE", "../../storage")

    # Vaccuum table + Sync WAL journal to DB
    db.connect()
    db.execute_sql("VACUUM")
    db.execute_sql("PRAGMA wal_checkpoint(TRUNCATE)")
    db.close()

    # Create single file of image + DB
    (_, fn) = tempfile.mkstemp(suffix=".tar")
    with tarfile.open(fn, "w:") as tar:
        tar.add(storage_path, "storage")

    now = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    final_fn = f"ludotheque_{now}.tar"
    return FileResponse(fn, filename=final_fn, background=BackgroundTask(os.remove, fn))


@router.get("/maintenance")
def run_maintenance(auth=Depends(auth_user)):
    "Run maintenance tasks"

    check_auth(auth, "admin")

    # Vaccuum table + Sync WAL journal to DB
    db.connect()
    db.execute_sql("VACUUM")
    db.execute_sql("PRAGMA wal_checkpoint(TRUNCATE)")
    db.close()

    # Update google sheets
    api.gsheets.publish_gsheets()

    return "OK"


def stats_per_day(stop_day, duration_weeks=4):
    global stats_cache

    if (stop_day in stats_cache) and (stop_day != datetime.date.today()):
        return stats_cache[stop_day]

    range_start = stop_day - datetime.timedelta(weeks=4)

    # Users on that day
    nbusers = (
        Loan.select(Loan.user)
        .where(
            (Loan.start == stop_day) | ((Loan.status == "in") & (Loan.stop == stop_day))
        )
        .distinct()
        .count()
    )
    if not nbusers:
        stats_cache[stop_day] = {}
        return stats_cache[stop_day]

    # Active users over a motnh
    activeusers = (
        Loan.select(Loan.user)
        .where(
            Loan.start.between(range_start, stop_day)
            | ((Loan.status == "in") & (Loan.stop.between(range_start, stop_day)))
        )
        .distinct()
        .count()
    )

    # Items (Total number loaned, new returned, new loaned)
    nbitems = (
        Loan.select()
        .where(
            (Loan.start <= stop_day) & ((Loan.status == "out") | (Loan.stop > stop_day))
        )
        .count()
    )
    nbitems_out = Loan.select().where(Loan.start == stop_day).count()
    nbitems_in = Loan.select().where(Loan.status == "in", Loan.stop == stop_day).count()

    stats_cache[stop_day] = {
        "users": {"day": nbusers, "month": activeusers},
        "items": {"totalout": nbitems, "out": nbitems_out, "in": nbitems_in},
    }
    return stats_cache[stop_day]


@router.get("/stats")
def stats(auth=Depends(auth_user)):
    "Return stats (Loans, Users)"

    check_auth(auth, "admin")

    with db:
        # Active users (Loans in/out last month) / week
        today = datetime.date.today()
        last_saturday = today - datetime.timedelta(days=(today.weekday() + 2) % 7)
        ret = {}

        for i in range(16):
            stats_day = last_saturday - datetime.timedelta(weeks=i)
            stats = stats_per_day(stats_day)
            if not stats:
                continue

            date_txt = stats_day.strftime("%Y%m%d")
            ret[date_txt] = stats
        return ret


@cachetools.func.ttl_cache(ttl=6 * 3600)
def get_next_saturday():
    "Return next saturday (not during holidays or public holiday)"
    today = datetime.date.today()
    next_sat = today + datetime.timedelta(days=(5 - today.weekday() + 7) % 7)

    # Today is already over 12h
    if next_sat == today and datetime.datetime.now().hour >= 12:
        next_sat += datetime.timedelta(days=7)

    shd = SchoolHolidayDates()
    jf = JoursFeries

    while shd.is_holiday_for_zone(next_sat, "B") or jf.is_bank_holiday(next_sat):
        next_sat += datetime.timedelta(days=7)

    return next_sat.isoformat()


@router.get("/info")
def info():
    "Return global information about the system"

    with db:
        return {
            "nbitems": Item.select().where(Item.enabled).count(),
            "domain": config.AUTH_DOMAIN,
            "pricing": config.PRICING,
            "next_opening": get_next_saturday(),
            "loan": {"maxitems": config.LOAN_MAXITEMS, "weeks": config.LOAN_WEEKS},
            "booking": {
                "maxitems": config.BOOKING_MAXITEMS,
                "weeks": config.BOOKING_WEEKS,
            },
            "image_max": config.IMAGE_MAX_DIM,
            "email_minperiod": config.EMAIL_MINPERIOD,
            "email_minlate": config.EMAIL_MINLATE,
            "version": "DEVDEV",
        }


def send_email(recipients: list[str], subject: str, body: str):
    "Send an email through GMail SMTP"

    if not os.getenv("SMTP_PASSWORD"):
        print("No SMTP password, not sending email")
        return {"sent": False, "error": "Envoi d'EMail désactivé"}

    try:
        html_message = MIMEText(body, "html")
        html_message["Subject"] = subject
        html_message["From"] = config.EMAIL_SENDER
        html_message["To"] = ", ".join(recipients)

        recipients.append(config.EMAIL_CC)
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(config.EMAIL_SENDER, os.getenv("SMTP_PASSWORD"))
            server.sendmail(config.EMAIL_SENDER, recipients, html_message.as_string())

        return {"sent": True}
    except Exception as e:
        logging.exception("Sending email")
        return {"sent": False, "error": str(e)}


def remove_all_benevoles():
    "Set the status of all benevoles to simple users"

    with db:
        User.update(role="user").where(User.role == "benevole").execute()


def log_event(user: User, text: str):
    try:
        if db_need_opening := db.is_closed():
            db.connect()
        Log.create(user=user.id, text=text)
    finally:
        if db_need_opening:
            db.close()


def clear_logs():
    three_months_ago = datetime.date.today() - datetime.timedelta(weeks=12)
    with db:
        Log.delete().where(Log.created_at < three_months_ago).execute()
