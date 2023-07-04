import datetime
import logging
from api.pwmodels import Loan, User, Item, db
from fastapi import APIRouter, HTTPException, Request, Depends
from api.system import auth_user
from playhouse.shortcuts import model_to_dict

router = APIRouter()


@router.get("/loans", tags=["loans"])
def get_loans(user_id: int, all: str | None = None, auth=Depends(auth_user)):
    if (not auth) or (auth.role != "admin" and (user_id != auth.id)):
        raise HTTPException(403)

    loans = Loan.select().where(Loan.user == user_id)
    if all is None:
        loans = loans.where(Loan.status == "out")
    return list(loans.dicts())


@router.post("/loans", tags=["loans"])
async def create_loan(request: Request, auth=Depends(auth_user)):
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    body = await request.json()
    for i in "user", "items", "cost":
        if i not in body:
            logging.error("Missing parameter '%s'", i)
            raise HTTPException(400, f"Missing parameter '{i}'")

    user = User.get_or_none(User.id == body["user"])
    if not user:
        logging.error("User '%s' not matching", body["user"])
        raise HTTPException(400, "No such user")

    items = [Item.get_or_none(Item.id == i) for i in body["items"]]
    if not all(items):
        logging.error("Cannot find some items")
        raise HTTPException(400, "Cannot find some items")

    # Check if any item was already borrowed by the same user
    already_borrowed = (
        Loan.select()
        .where(Loan.user == user, Loan.item.in_(items), Loan.status == "out")
        .count()
    )
    if already_borrowed:
        logging.error("%d items are already borrowed by the user", already_borrowed)
        raise HTTPException(400, "Some items are already borrowed by the same user")

    topay_fromcredit = min(body["cost"], user.credit)

    loans = []
    with db.transaction():
        today = datetime.date.today()

        # For each item, forget any other loan and create a new one
        for i in items:
            Loan.update({"status": "in", "stop": today}).where(
                Loan.item == i, Loan.status == "out"
            ).execute()

            # Loan start/stop/status are set as default in pwmodels
            loan = Loan.create(user=user, item=i)
            loans.append(model_to_dict(loan))

        # Update user credit
        if topay_fromcredit:
            user.credit -= topay_fromcredit
            user.save()

    return loans


@router.get("/loans/{loan_id}", tags=["loans"])
def get_loan(loan_id: int, auth=Depends(auth_user)):
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    if loan := Loan.get_or_none(loan_id):
        return model_to_dict(loan, recurse=False)
    raise HTTPException(404)


@router.get("/loans/{loan_id}/close", tags=["loans"])
def close_loan(loan_id: int, auth=Depends(auth_user)):
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    loan = Loan.get_or_none(Loan.id == loan_id)
    if not loan:
        raise HTTPException(400, "No such loan")
    if loan.status != "out":
        raise HTTPException(400, "Already closed")

    loan.stop = datetime.date.today()
    loan.status = "in"
    loan.save()
    return model_to_dict(loan, recurse=False)


@router.delete("/loans/{loan_id}", tags=["loans"])
async def delete_loan(loan_id: int, auth=Depends(auth_user)):
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    loan = Loan.get_or_none(Loan.id == loan_id)
    if not loan:
        raise HTTPException(404)
    loan.delete_instance(recursive=True)
    return "OK"
