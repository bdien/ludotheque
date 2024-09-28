from api.main import app
from api.system import auth_user
from api.pwmodels import User, Item, db, Booking
from api.config import BOOKING_MAX
from fastapi.testclient import TestClient
from conftest import AUTH_USER, AUTH_USER_ID, fake_auth_user


client = TestClient(app)
app.dependency_overrides[auth_user] = fake_auth_user


def test_book():
    with db:
        item = Item.create(id=5, name="item1")
        user = User.create(id=AUTH_USER_ID, name="user")

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
        User.create(id=AUTH_USER_ID, name="user")

    response = client.post("/bookings", json={"item": item.id}, headers=AUTH_USER)
    assert response.status_code == 200
    response = client.post("/bookings", json={"item": item.id}, headers=AUTH_USER)
    assert response.status_code == 400


def test_book_BOOKING_MAX():
    with db:
        items = [Item.create(name="item") for _ in range(BOOKING_MAX + 1)]
        User.create(id=AUTH_USER_ID, name="user")

    for i in range(BOOKING_MAX):
        response = client.post(
            "/bookings", json={"item": items[i].id}, headers=AUTH_USER
        )
        assert response.status_code == 200

    # Next one should be denied
    response = client.post("/bookings", json={"item": items[-1].id}, headers=AUTH_USER)
    assert response.status_code == 403


def test_book_nonexistant_item():
    with db:
        User.create(id=AUTH_USER_ID, name="user")

    response = client.post("/bookings", json={"item": 666}, headers=AUTH_USER)
    assert response.status_code == 400


def test_unbook_without_book():
    with db:
        User.create(id=AUTH_USER_ID, name="user")

    response = client.delete("/bookings/1234", headers=AUTH_USER)
    assert response.status_code == 400


def test_unbook_another_user():
    with db:
        item = Item.create(name="item")
        user = User.create(id=123, name="user")
        booking = Booking.create(user=user, item=item)

    response = client.delete(f"/bookings/{booking.id}", headers=AUTH_USER)
    assert response.status_code == 400
