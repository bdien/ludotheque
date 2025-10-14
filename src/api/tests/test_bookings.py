from conftest import AUTH_USER, AUTH_USER_ID, fake_auth_user
from fastapi.testclient import TestClient

from api.config import BOOKING_MAXITEMS
from api.main import app
from api.pwmodels import Booking, Item, User, db
from api.system import auth_user

client = TestClient(app)
app.dependency_overrides[auth_user] = fake_auth_user


def test_book():
    with db:
        item = Item.create(id=5, name="item1")
        user = User.get(id=AUTH_USER_ID)

    # Book
    response = client.post("/bookings", json={"item": item.id}, headers=AUTH_USER)
    assert response.status_code == 200

    with db:
        booking = Booking.select().where(Booking.user == user, Booking.item == item)
        assert len(booking) == 1
        booking_id = booking.get().id

    # Unbook
    response = client.delete(f"/bookings/{booking_id}", headers=AUTH_USER)
    assert response.status_code == 200

    with db:
        booking = Booking.select().where(Booking.user == user, Booking.item == item)
        assert len(booking) == 0


def test_book_twice():
    with db:
        item = Item.create(id=5, name="item1")

    response = client.post("/bookings", json={"item": item.id}, headers=AUTH_USER)
    assert response.status_code == 200
    response = client.post("/bookings", json={"item": item.id}, headers=AUTH_USER)
    assert response.status_code == 400


def test_book_BOOKING_MAXITEMS():
    with db:
        items = [Item.create(name="item") for _ in range(BOOKING_MAXITEMS + 1)]

    for i in range(BOOKING_MAXITEMS):
        response = client.post(
            "/bookings", json={"item": items[i].id}, headers=AUTH_USER
        )
        assert response.status_code == 200

    # Next one should be denied
    response = client.post("/bookings", json={"item": items[-1].id}, headers=AUTH_USER)
    assert response.status_code == 403


def test_book_nonexistant_item():
    response = client.post("/bookings", json={"item": 666}, headers=AUTH_USER)
    assert response.status_code == 400


def test_unbook_without_book():
    response = client.delete("/bookings/1234", headers=AUTH_USER)
    assert response.status_code == 400


def test_unbook_another_user():
    with db:
        item = Item.create(name="item")
        user = User.create(id=123, name="user")
        booking = Booking.create(user=user, item=item)

    response = client.delete(f"/bookings/{booking.id}", headers=AUTH_USER)
    assert response.status_code == 400
