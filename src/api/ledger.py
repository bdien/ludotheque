import datetime

from fastapi import APIRouter, Depends

from api.pwmodels import Ledger, db
from api.system import auth_user, check_auth

router = APIRouter()


@router.get("/ledger", tags=["ledger"])
async def get_ledger(auth=Depends(auth_user)) -> list:
    check_auth(auth, "admin")
    with db:
        last_year = datetime.datetime.now() - datetime.timedelta(days=365)
        return list(
            Ledger.select().where(Ledger.day > last_year).order_by(Ledger.day).dicts()
        )
