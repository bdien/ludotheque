import contextlib
import locale
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import api.users
import api.items
import api.loans
import api.system
import api.ledger
import api.gsheets

logging.basicConfig(level=logging.DEBUG)
with contextlib.suppress(Exception):
    locale.setlocale(locale.LC_ALL, "fr_FR.UTF-8")


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Schedule GSheets refresh and also refresh now
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        api.gsheets.publish_gsheets, "cron", hour=13, misfire_grace_time=None
    )
    scheduler.start()
    api.gsheets.publish_gsheets()

    # Let FastAPI handle HTTP requests
    yield

    # Shutdown
    scheduler.shutdown()


app = FastAPI(root_path="/api", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins="*")
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.include_router(api.users.router)
app.include_router(api.items.router)
app.include_router(api.loans.router)
app.include_router(api.system.router)
app.include_router(api.ledger.router)
