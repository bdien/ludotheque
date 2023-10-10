from api.pwmodels import Ledger, db
from fastapi import APIRouter, HTTPException, Depends
from api.system import auth_user

router = APIRouter()


@router.get("/ledger", tags=["ledger"])
async def get_ledger(auth=Depends(auth_user)) -> list:
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    with db:
        return list(Ledger.select().order_by(Ledger.day).dicts())
