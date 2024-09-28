import peewee
from api.pwmodels import (
    Booking,
    db,
)
from api.system import auth_user, check_auth
from api.config import BOOKING_MAX
from fastapi import APIRouter, HTTPException, Request, Depends

router = APIRouter()


@router.post("/bookings", tags=["bookings"])
async def book_item(request: Request, auth=Depends(auth_user)):
    "Book an item"

    check_auth(auth)
    body = await request.json()
    if not body.get("item"):
        raise HTTPException(400, "Missing item")
    item_id = body["item"]

    with db:
        # Check if item was already booked by the same user
        if Booking.get_or_none(user=auth.id, item=item_id):
            raise HTTPException(400, "Already booked")

        # Check number of bookings
        nb_bookings = Booking.select().where(Booking.user == auth.id).count()
        if nb_bookings >= BOOKING_MAX:
            raise HTTPException(403, "Too many bookings")

        # Create booking
        try:
            return Booking.create(user=auth.id, item=item_id)
        except peewee.IntegrityError as e:
            raise HTTPException(400, "Item does not exists") from e


@router.delete("/bookings/{booking_id}", tags=["bookings"])
async def unbook_item(booking_id: int, auth=Depends(auth_user)):
    "Unbook an item"

    check_auth(auth)

    with db:
        nb = (
            Booking.delete()
            .where(Booking.user == auth.id, Booking.id == booking_id)
            .execute()
        )
        if nb == 0:
            raise HTTPException(400, "Booking not found")
    return {"sucess": True}
