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
from api.config import (
    AUTH_DOMAIN,
    PRICING,
    APIKEY_PREFIX,
    LOAN_DAYS,
    IMAGE_MAX_DIM,
    EMAIL_SENDER,
)


router = APIRouter()
auth_cache = cachetools.TTLCache(maxsize=64, ttl=60 * 5)


@dataclasses.dataclass(frozen=True)
class AuthUser:
    id: int
    role: str


def __validate_token(authorization: str) -> str | None:
    "Validate token, fetch user info and extract email"
    r = requests.get(
        f"https://{AUTH_DOMAIN}/userinfo",
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
    if f" {APIKEY_PREFIX}" in authorization.lower():
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

        return AuthUser(user.id, user.role)

    # Validate token and extract email
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

    return AuthUser(user.id, user.role)


@router.get("/backup")
def create_backup(auth=Depends(auth_user)):
    "Create a TAR file with the DB and images"

    if not auth or auth.role != "admin":
        raise HTTPException(403)

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
            "domain": AUTH_DOMAIN,
            "pricing": PRICING,
            "loan": {"days": LOAN_DAYS},
            "image_max": IMAGE_MAX_DIM,
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
        html_message["From"] = EMAIL_SENDER
        html_message["To"] = ", ".join(recipients)

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_SENDER, os.getenv("SMTP_PASSWORD"))
            server.sendmail(EMAIL_SENDER, recipients, html_message.as_string())

        return {"sent": True}
    except Exception as e:
        logging.exception("Sending email")
        return {"sent": False, "error": str(e)}
