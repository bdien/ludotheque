from api.pwmodels import Ledger, db
from fastapi import APIRouter, Depends
from api.system import auth_user, check_auth

router = APIRouter()


@router.get("/ledger", tags=["ledger", "admin"])
async def get_ledger(auth=Depends(auth_user)) -> list:
    check_auth(auth, "admin")
    with db:
        return list(Ledger.select().order_by(Ledger.day).dicts())
