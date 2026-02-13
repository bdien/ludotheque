import datetime

from fastapi import APIRouter, Depends

from api.pwmodels import Ledger, db
from api.system import auth_user_required

router = APIRouter()


@router.get("/ledger", tags=["ledger"])
async def get_ledger(auth=Depends(auth_user_required)) -> list:
    auth.check_right("system")
    with db:
        last_year = datetime.datetime.now() - datetime.timedelta(days=365)
        return list(
            Ledger.select().where(Ledger.day > last_year).order_by(Ledger.day).dicts()
        )
