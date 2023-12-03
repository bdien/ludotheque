from typing import Annotated
import requests
import logging
import cachetools.func
import datetime
import os
import dataclasses
import smtplib
from email.mime.text import MIMEText
import tempfile
import tarfile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from fastapi import APIRouter, Depends, HTTPException, Header
from api.pwmodels import Item, User, EMail, db
from api import config


router = APIRouter()
auth_cache = cachetools.TTLCache(maxsize=64, ttl=60 * 2)


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


@cachetools.func.ttl_cache
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


@router.get("/info")
def info():
    "Return global information about the system"

    with db:
        return {
            "nbitems": Item.select().where(Item.enabled).count(),
            "domain": config.AUTH_DOMAIN,
            "pricing": config.PRICING,
            "loan": {"days": config.LOAN_DAYS},
            "image_max": config.IMAGE_MAX_DIM,
            "email_minperiod": config.EMAIL_MINPERIOD,
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
