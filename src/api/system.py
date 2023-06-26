from typing import Annotated
import datetime
import os
import dataclasses
import tempfile
import tarfile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from fastapi import APIRouter, Header
from api.pwmodels import Item

router = APIRouter()


@dataclasses.dataclass(frozen=True)
class AuthUser:
    id: int
    email: str
    role: str


@router.get("/backup")
def create_backup():
    "Create a TAR file with the DB and images"

    storage_path = os.getenv("LUDO_STORAGE", "../../storage")

    # Create single file of image + DB
    (_, fn) = tempfile.mkstemp(suffix=".tar")
    with tarfile.open(fn, "w:") as tar:
        tar.add(storage_path, "storage")

    now = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    final_fn = f"ludotheque_{now}.tar"
    return FileResponse(fn, filename=final_fn, background=BackgroundTask(os.remove, fn))


def auth_user(authorization: Annotated[str | None, Header()] = None) -> AuthUser:
    "Authenticate the user and return id/email/role"
    if not authorization:
        return None
    return AuthUser(*authorization.split(","))


@router.get("/info")
def info():
    "Return global information about the system"

    return {"nbitems": Item.select().count()}
