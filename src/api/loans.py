import datetime
from api.pwmodels import Loan, User, Item, db
from fastapi import APIRouter, HTTPException, Request
from playhouse.shortcuts import model_to_dict

FAKE_USER = 1
FAKE_USER_ROLE = "operator"  # Could be user, operator, admin
LOAN_COST = 0.5
LOAN_TIME_DAYS = 7 * 3

router = APIRouter()


@router.get("/loans", tags=["loans"])
def get_loans(all: str | None = None, user: str | None = None):
    if user is None:
        user = FAKE_USER

    loans = Loan.select().where(Loan.user == user)
    if all is None:
        loans = loans.where(Loan.status == "out")
    return list(loans.dicts())


@router.post("/loans", tags=["loans"])
async def create_loan(request: Request):
    body = await request.json()
    for i in "user", "items", "cost":
        if i not in body:
            raise HTTPException(400, f"Missing parameter '{i}'")

    user = User.get_or_none(User.id == body["user"])
    if not user:
        raise HTTPException(400, "No such user")

    items = [Item.get_or_none(Item.id == i) for i in body["items"]]
    if not all(items):
        raise HTTPException(400, "Cannot find some items")

    topay_fromcredit = min(body["cost"], user.credit)

    loans = []
    with db.transaction():
        today = datetime.date.today()

        # For each item, forget any other loan and create a new one
        for i in items:
            Loan.update({"status": "in", "stop": today}).where(
                Loan.id == i, Loan.status == "out"
            ).execute()

            loan = Loan.create(
                user=user,
                item=i,
                start=today,
                stop=today + datetime.timedelta(days=LOAN_TIME_DAYS),
                status="out",
            )
            loans.append(model_to_dict(loan))

        # Update user credit
        if topay_fromcredit:
            user.credit -= topay_fromcredit
            user.save()

    return loans


@router.get("/loans/{loan_id}", tags=["loans"])
def get_loan(loan_id: int):
    if loan := Loan.get_or_none(loan_id):
        return model_to_dict(loan, recurse=False)
    raise HTTPException(404)


@router.get("/loans/{loan_id}/close", tags=["loans"])
def close_loan(loan_id: int):
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
async def delete_loan(loan_id: int):
    if FAKE_USER_ROLE in ("operator", "admin"):
        HTTPException(403)

    loan = Loan.get_or_none(Loan.id == loan_id)
    if not loan:
        raise HTTPException(404)
    loan.delete_instance(recursive=True)
    return "OK"
