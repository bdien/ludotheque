import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import api.users
import api.items
import api.loans


logging.basicConfig(level=logging.DEBUG)
app = FastAPI(root_path="/api")
app.add_middleware(CORSMiddleware, allow_origins="*")
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.include_router(api.users.router)
app.include_router(api.items.router)
app.include_router(api.loans.router)
