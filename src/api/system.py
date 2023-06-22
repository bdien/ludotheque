import datetime
import os
import tempfile
import tarfile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from fastapi import APIRouter

router = APIRouter()


@router.get("/backup")
def create_backup():
    storage_path = os.getenv("LUDO_STORAGE", "../../storage")

    # Create single file of image + DB
    (_, fn) = tempfile.mkstemp(suffix=".tar")
    with tarfile.open(fn, "w:") as tar:
        tar.add(storage_path, "storage")

    now = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    final_fn = f"ludotheque_{now}.tar"
    return FileResponse(fn, filename=final_fn, background=BackgroundTask(os.remove, fn))
