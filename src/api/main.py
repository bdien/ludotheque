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
import api.bookings

logging.basicConfig(level=logging.DEBUG)
with contextlib.suppress(Exception):
    locale.setlocale(locale.LC_ALL, "fr_FR.UTF-8")


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = BackgroundScheduler()

    # Every day at 13h, update Google Sheets
    scheduler.add_job(
        api.gsheets.publish_gsheets,
        "cron",
        hour=13,
        misfire_grace_time=None,
    )
    # Every saturday at 12h45, reset the status of all benevoles
    scheduler.add_job(
        api.system.remove_all_benevoles,
        "cron",
        day_of_week="sat",
        hour=12,
        minute=45,
        misfire_grace_time=None,
    )
    # Every week, clear logs
    scheduler.add_job(
        api.system.clear_logs,
        "cron",
        day_of_week="sun",
        hour=23,
        misfire_grace_time=None,
    )

    # Let FastAPI handle HTTP requests
    scheduler.start()
    yield

    # Shutdown
    scheduler.shutdown()


app = FastAPI(root_path="/api", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins="*")
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.include_router(api.users.router)
app.include_router(api.items.router)
app.include_router(api.bookings.router)
app.include_router(api.loans.router)
app.include_router(api.system.router)
app.include_router(api.ledger.router)
