from typing import Annotated
import requests
import logging
import cachetools.func
import datetime
import os
import dataclasses
import tempfile
import tarfile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from fastapi import APIRouter, Depends, HTTPException, Header
from api.pwmodels import Item, User, db
from api.config import AUTH_DOMAIN, PRICING, APIKEY_PREFIX, LOAN_DAYS

router = APIRouter()
auth_cache = cachetools.TTLCache(maxsize=64, ttl=60 * 5)


@dataclasses.dataclass(frozen=True)
class AuthUser:
    id: int
    email: str
    role: str


@cachetools.func.ttl_cache
def auth_user(authorization: Annotated[str | None, Header()] = None) -> AuthUser:
    "Authenticate the user and return id/email/role"
    if (not authorization) or (not authorization.lower().startswith("bearer")):
        return None

    # API-Key ?
    if f" {APIKEY_PREFIX}" in authorization.lower():
        with db:
            apikey = authorization.lower().removeprefix("bearer ")
            user = User.get_or_none(apikey=apikey, enabled=True)
            if not user:
                logging.warning("Cannot find user in DB with APIKey")
                return None

        return AuthUser(user.id, user.email, user.role)

    # Fetch user configuration (it will validate the token as well)
    r = requests.get(
        f"https://{AUTH_DOMAIN}/userinfo",
        headers={"Authorization": authorization},
        timeout=60,
    )
    if r.status_code != 200:
        logging.warning("Unable to validate token")
        return None
    email = r.json().get("email")
    if not email:
        logging.warning("No email in Token")
        return None

    # Look into DB
    with db:
        user = User.get_or_none(email=email, enabled=True)
        if not user:
            logging.warning("Cannot find user %s in DB", email)
            return None

    return AuthUser(user.id, user.email, user.role)


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
            "nbitems": Item.select().count(),
            "domain": AUTH_DOMAIN,
            "pricing": PRICING,
            "loan": {"days": LOAN_DAYS},
        }
