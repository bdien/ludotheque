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
__shd = SchoolHolidayDates()


@dataclasses.dataclass(frozen=True)
class AuthUser:
    id: int
    role: str
    rights: list[str]

    def has_right(self, right: str) -> bool:
        return right in self.rights

    def check_right(self, right: str):
        if not self.has_right(right):
            logging.warning(
                "User %d with role '%s' does not have right '%s'",
                self.id,
                self.role,
                right,
            )
            raise HTTPException(403, "Forbidden")


def _compute_rights(role: str) -> list[str]:
    rights = set()

    # Allow to create loans/items/users
    if __check_role(role, "admin"):
        rights.update({"user_create", "item_create", "loan_create", "booking_create"})

    # Allow to manage loans/items (return, extend, edit) + list users (To close loans)
    if __check_role(role, "admin"):
        rights.update({"loan_manage", "item_manage", "booking_manage", "user_list"})

    # Allow to manage users (export, edit, enable/disable, email)
    if __check_role(role, "admin"):
        rights.update({"user_list", "user_manage"})

    # Allow to delete users/items/loans
    if __check_role(role, "admin"):
        rights.update({"user_delete", "item_delete", "loan_delete", "booking_delete"})

    # Allow to do maintenance, access stats, ledger, backup
    if __check_role(role, "admin"):
        rights.add("system")

    return list(rights)


def __check_role(role: str, minrole: str = "user") -> bool:
    if (minrole == "admin") and (role != "admin"):
        return False
    return not ((minrole == "benevole") and (role not in ("admin", "benevole")))


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
def auth_user(
    authorization: Annotated[str | None, Header()] = None,
) -> AuthUser | None:
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
    if os.getenv("LUDO_ENV") == "production":
        now = datetime.datetime.now()
        if user.role == "benevole" and not (
            now.weekday() == 5 and (10 <= now.hour <= 12)
        ):
            user.role = "user"

    # Compute rights
    rights = _compute_rights(user.role)

    return AuthUser(user.id, user.role, rights)


def auth_user_required(
    auth: Annotated[AuthUser | None, Depends(auth_user)],
) -> AuthUser:
    if auth is None:
        raise HTTPException(401, "Une authentification est nécessaire")
    return auth


@router.get("/backup", tags=["admin"])
def create_backup(auth=Depends(auth_user_required)):
    "Create a TAR file with the DB and images"

    auth.check_right("system")
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


@router.get("/maintenance", tags=["admin"])
def run_maintenance(auth=Depends(auth_user_required)):
    "Run maintenance tasks"

    auth.check_right("system")

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


@router.get("/stats", tags=["admin"])
def stats(auth=Depends(auth_user_required)):
    "Return stats (Loans, Users)"

    auth.check_right("system")

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


@cachetools.func.ttl_cache(ttl=3600)
def get_next_opening():
    "Return next opening day (not during holidays or public holiday)"

    now = datetime.datetime.now()

    # If today is a saturday and it is after 12h, select the next day
    if now.weekday() == 5 and now.hour >= 12:
        now += datetime.timedelta(days=1)

    return get_next_saturday(now.date()).isoformat()


def is_closed(date: datetime.date) -> bool:
    # Férié
    if JoursFeries.is_bank_holiday(date):
        return True

    # Vacances scolaires zone B (Except first and last saturday)
    friday_before = date - datetime.timedelta(days=1)
    monday_after = date + datetime.timedelta(days=2)

    return (
        __shd.is_holiday_for_zone(date, "B")
        and __shd.is_holiday_for_zone(friday_before, "B")
        and __shd.is_holiday_for_zone(monday_after, "B")
    )


def get_next_saturday(today: datetime.date) -> datetime.date:
    "Return the following opened saturday (not during holidays or public holiday)"

    next_sat = today + datetime.timedelta(days=(5 - today.weekday() + 7) % 7)
    while is_closed(next_sat):
        next_sat += datetime.timedelta(days=7)

    return next_sat


@router.get("/info")
def info():
    "Return global information about the system"

    with db:
        return {
            "nbitems": Item.select().where(Item.enabled).count(),
            "domain": config.AUTH_DOMAIN,
            "pricing": config.PRICING,
            "next_opening": get_next_opening(),
            "loan": {
                "maxitems": config.LOAN_MAXITEMS,
                "weeks": config.LOAN_WEEKS,
                "extend_max": config.LOAN_EXTEND_MAX,
            },
            "booking": {
                "maxitems": config.BOOKING_MAXITEMS,
                "weeks": config.BOOKING_WEEKS,
            },
            "image_max": config.IMAGE_MAX_DIM,
            "email_minperiod": config.EMAIL_MINPERIOD,
            "email_minlate": config.EMAIL_MINLATE,
            "item_new_days": config.ITEM_NEW_DAYS,
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
            server.login(config.EMAIL_SENDER, os.environ["SMTP_PASSWORD"])
            server.sendmail(config.EMAIL_SENDER, recipients, html_message.as_string())

        return {"sent": True}
    except Exception as e:
        logging.exception("Sending email")
        return {"sent": False, "error": str(e)}


def remove_all_benevoles():
    "Set the status of all benevoles to simple users"

    with db:
        User.update(role="user").where(User.role == "benevole").execute()


def log_event(user: User | AuthUser | None, text: str):
    try:
        user_id = (user and user.id) or None
        if db_need_opening := db.is_closed():
            db.connect()
        Log.create(user=user_id, text=text)
    finally:
        if db_need_opening:
            db.close()


def clear_logs():
    three_months_ago = datetime.date.today() - datetime.timedelta(weeks=12)
    with db:
        Log.delete().where(Log.created_at < three_months_ago).execute()
