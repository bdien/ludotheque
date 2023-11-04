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
app = FastAPI(root_path="/api")
app.add_middleware(CORSMiddleware, allow_origins="*")
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.include_router(api.users.router)
app.include_router(api.items.router)
app.include_router(api.loans.router)
app.include_router(api.system.router)
app.include_router(api.ledger.router)


@app.on_event("startup")
def init_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        api.gsheets.publish_gsheets, "cron", hour=13, misfire_grace_time=None
    )
    scheduler.start()

    # Refresh now
    api.gsheets.publish_gsheets()
