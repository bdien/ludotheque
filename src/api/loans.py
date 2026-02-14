import datetime
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from playhouse.shortcuts import model_to_dict

from api.config import LOAN_EXTEND_MAX, LOAN_WEEKS, PRICING
from api.pwmodels import Item, Ledger, Loan, User, db
from api.system import AuthUser, auth_user_required, get_next_saturday, is_closed

router = APIRouter()


@router.get("/loans", tags=["loans"])
def get_loans(auth: Annotated[AuthUser, Depends(auth_user_required)]):
    auth.check_right("loan_manage")
    loans = Loan.select().order_by(Loan.stop, Loan.user)
    with db:
        return list(loans.dicts())


@router.get("/loans/late", tags=["loans"])
def get_loans_late(
    auth: Annotated[AuthUser, Depends(auth_user_required)], mindays: int = 0
):
    auth.check_right("loan_manage")
    stop_date = datetime.date.today() - datetime.timedelta(days=mindays)

    loans = Loan.select().order_by(Loan.stop, Loan.user)
    loans = loans.where(Loan.status == "out", Loan.stop < stop_date)

    with db:
        return list(loans.dicts())


def calculate_loan_stop_date() -> datetime.date:
    "Calculate the stop date for a new loan, based on the next opening saturday + LOAN_WEEKS"

    today = datetime.date.today()
    theorical_date = today + datetime.timedelta(days=7 * LOAN_WEEKS)

    # Adjusted for public holidays
    adjusted = get_next_saturday(theorical_date)

    # If the jump is huge, check for the opening before the theorical date
    if (adjusted - theorical_date).days > 30:
        while theorical_date > today:
            if not is_closed(theorical_date):
                return theorical_date
            theorical_date -= datetime.timedelta(days=7)

    return adjusted


@router.post("/loans", tags=["loans"])
async def create_loan(
    request: Request, auth: Annotated[AuthUser, Depends(auth_user_required)]
):
    auth.check_right("loan_create")
    body = await request.json()
    for i in "user", "items":
        if i not in body:
            logging.error("Missing parameter '%s'", i)
            raise HTTPException(400, f"Missing parameter '{i}'")

    with db:
        user = User.get_or_none(User.id == body["user"])
        if not user:
            logging.error("User '%s' not matching", body["user"])
            raise HTTPException(400, "No such user")

        # List of items already borrowed by the user
        user_items_borrowed = (
            loan.item_id
            for loan in Loan.select(Loan.item).where(
                Loan.user == user, Loan.status == "out"
            )
        )

        # Will contains the final prices for all items + subscription + card
        final_prices = body["items"].copy()

        # Special cases (Yearly subscription (-1) / Fill loan card (-2))
        if subscription := -1 in body["items"]:
            final_prices[final_prices.index(-1)] = PRICING["yearly"]
            body["items"].remove(-1)
        if fillcard := -2 in body["items"]:
            final_prices[final_prices.index(-2)] = PRICING["card"]
            body["items"].remove(-2)
        simulation = body.get("simulation", False)

        # Regular items
        items = [Item.get_or_none(Item.id == i) for i in body["items"]]
        if not all(items):
            logging.error("Cannot find some items")
            raise HTTPException(400, "Cannot find some items")

        # Check if any item was already borrowed by the same user
        if any(item.id in user_items_borrowed for item in items):
            logging.error("items are already borrowed by the user")
            raise HTTPException(400, "Some items are already borrowed by the same user")

        # Money to pay from "real" money in any case
        topay_realmoney = PRICING["yearly"] if subscription else 0
        if fillcard:
            topay_realmoney += PRICING["card"]

            # Simulate new user card
            user.credit += PRICING["card_value"]

        # Now calculate how much is taken from the card and how much is remaining
        cost_items = [PRICING["big" if i.big else "regular"] for i in items]
        # Benevole/Admin: nullify item prices
        if user.role in ("admin", "benevole"):
            cost_items = [0] * len(cost_items)
        total_costitems = sum(cost_items)
        cost = topay_realmoney + total_costitems
        topay_fromcredit = min(total_costitems, user.credit)
        topay_realmoney += total_costitems - topay_fromcredit

        # Update user credit and lastseen
        user.credit -= topay_fromcredit
        user.lastseen = datetime.date.today()

        # Write in DB
        loans = []
        if not simulation:
            today = datetime.date.today()
            loan_stop_date = calculate_loan_stop_date()
            remaining_topay_fromcredit = topay_fromcredit

            # For each item, forget any other loan and create a new one
            for i, c in zip(items, cost_items, strict=True):
                Loan.update({"status": "in", "stop": today}).where(
                    Loan.item == i, Loan.status == "out"
                ).execute()

                # Loan start/status are set as default in pwmodels
                loan = Loan.create(user=user, item=i, stop=loan_stop_date)
                loans.append(model_to_dict(loan))

                # Real Money (If paid from credit, it is not real money)
                cost_real_money = max(0, c - remaining_topay_fromcredit)
                remaining_topay_fromcredit = max(0, remaining_topay_fromcredit - c)

                # Create DB entry
                Ledger.create(
                    operator_id=auth.id,
                    user_id=user.id,
                    loan_id=loan.id,
                    item_id=i.id,
                    cost=c,
                    money=cost_real_money,
                )

                # Update item lastseen column
                i.lastseen = datetime.date.today()
                i.save()

            # Update user credit and subscription (And reenable if needed)
            if subscription:
                Ledger.create(
                    operator_id=auth.id,
                    user_id=user.id,
                    item_id=-1,
                    cost=PRICING["yearly"],
                    money=PRICING["yearly"],
                )
                user.subscription = max(
                    datetime.date.today(), user.subscription
                ) + datetime.timedelta(days=366)
                user.enabled = True
            if fillcard:
                Ledger.create(
                    operator_id=auth.id,
                    user_id=user.id,
                    item_id=-2,
                    cost=PRICING["card"],
                    money=PRICING["card"],
                )

            user.save()

        # Update final prices to be sent back to the API caller
        for i, c in zip(items, cost_items, strict=True):
            final_prices[final_prices.index(i.id)] = c

        return {
            "cost": cost,
            "items_cost": final_prices,
            "topay": {"credit": topay_fromcredit, "real": topay_realmoney},
            "new_credit": user.credit,
            "loans": loans,
        }


@router.get("/loans/{loan_id}", tags=["loan"])
def get_loan(loan_id: int, auth: Annotated[AuthUser, Depends(auth_user_required)]):
    auth.check_right("loan_manage")
    with db:
        if loan := Loan.get_or_none(loan_id):
            return model_to_dict(loan, recurse=False)
    raise HTTPException(404)


@router.post("/loans/{loan_id}/close", tags=["loan"])
def close_loan_post(
    loan_id: int, auth: Annotated[AuthUser, Depends(auth_user_required)]
):
    auth.check_right("loan_manage")
    return close_loan(loan_id, auth)


@router.get("/loans/{loan_id}/close", tags=["loan"])
def close_loan(loan_id: int, auth: Annotated[AuthUser, Depends(auth_user_required)]):
    auth.check_right("loan_manage")
    with db:
        loan = Loan.get_or_none(Loan.id == loan_id)
        if not loan:
            raise HTTPException(400, "No such loan")
        if loan.status != "out":
            raise HTTPException(400, "Already closed")

        loan.stop = datetime.date.today()
        loan.status = "in"
        loan.save()

        # Update user lastseen column
        User.update(lastseen=datetime.date.today()).where(
            User.id == loan.user
        ).execute()

        # Update item lastseen column
        Item.update(lastseen=datetime.date.today()).where(
            Item.id == loan.item
        ).execute()

        return model_to_dict(loan, recurse=False)


@router.post("/loans/{loan_id}/extend", tags=["loan"])
def extend_loan(loan_id: int, auth: Annotated[AuthUser, Depends(auth_user_required)]):
    auth.check_right("loan_manage")
    with db:
        loan = Loan.get_or_none(Loan.id == loan_id)
        if not loan:
            raise HTTPException(400, "No such loan")
        if loan.status != "out":
            raise HTTPException(400, "Already closed")
        if loan.extended >= LOAN_EXTEND_MAX:
            raise HTTPException(400, "Maximum number of extensions reached")

        loan.stop += datetime.timedelta(days=15)
        loan.extended += 1
        loan.save()

        return model_to_dict(loan, recurse=False)


@router.delete("/loans/{loan_id}", tags=["loan"])
async def delete_loan(
    loan_id: int, auth: Annotated[AuthUser, Depends(auth_user_required)]
):
    auth.check_right("loan_delete")
    with db:
        loan = Loan.get_or_none(Loan.id == loan_id)
        if not loan:
            raise HTTPException(404)
        loan.delete_instance(recursive=True)
        return "OK"
