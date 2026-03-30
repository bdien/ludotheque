import datetime

from conftest import AUTH_ADMIN, AUTH_USER, fake_auth_user
from fastapi.testclient import TestClient

from api.main import app
from api.pwmodels import Item, Loan, User, db
from api.system import auth_user

client = TestClient(app)
app.dependency_overrides[auth_user] = fake_auth_user

USER_ID = 66
ITEM_ID = 158


def test_calendar_feed(dbtables):
    """Test that the calendar feed returns valid iCal with grouped events."""
    with db:
        user = User.create(id=USER_ID, name="Testeur")
        Item.create(id=ITEM_ID, name="Catan")
        Item.create(id=ITEM_ID + 1, name="Dixit")
        Item.create(id=ITEM_ID + 2, name="Uno")
        stop1 = datetime.date(2026, 4, 11)
        stop2 = datetime.date(2026, 4, 18)
        # Two loans with same stop date -> should be grouped
        Loan.create(user=user, item=ITEM_ID, stop=stop1)
        Loan.create(user=user, item=ITEM_ID + 1, stop=stop1)
        # One loan with different stop date
        Loan.create(user=user, item=ITEM_ID + 2, stop=stop2)

    resp = client.get(f"/calendar/{user.calendar_token}.ics")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "text/calendar; charset=utf-8"

    body = resp.text
    assert "VCALENDAR" in body
    assert "VEVENT" in body
    # Two grouped events
    assert body.count("BEGIN:VEVENT") == 2
    # First event groups Catan and Dixit (iCal escapes commas)
    assert r"- Catan\n - Dixit" in body
    # Second event has Uno
    assert "- Uno" in body
    # Check times (10:30 and 12:00)
    assert "T103000" in body
    assert "T120000" in body


def test_calendar_feed_invalid_token(dbtables):
    """Test that an invalid token returns 404."""
    resp = client.get("/calendar/nonexistenttoken.ics")
    assert resp.status_code == 404


def test_calendar_feed_no_loans(dbtables):
    """Test that a user with no active loans returns an empty calendar."""
    with db:
        user = User.create(id=USER_ID, name="Testeur")

    resp = client.get(f"/calendar/{user.calendar_token}.ics")
    assert resp.status_code == 200
    assert "VCALENDAR" in resp.text
    assert "VEVENT" not in resp.text


def test_calendar_feed_excludes_returned_loans(dbtables):
    """Test that returned loans (status='in') are excluded from the feed."""
    with db:
        user = User.create(id=USER_ID, name="Testeur")
        Item.create(id=ITEM_ID, name="Catan")
        Item.create(id=ITEM_ID + 1, name="Dixit")
        Loan.create(user=user, item=ITEM_ID, status="in")
        Loan.create(user=user, item=ITEM_ID + 1, status="out")

    resp = client.get(f"/calendar/{user.calendar_token}.ics")
    assert resp.status_code == 200
    assert "Dixit" in resp.text
    assert "Catan" not in resp.text


def test_user_creation_has_calendar_token(dbtables):
    """Test that a newly created user has a calendar_token set."""
    resp = client.post(
        "/users",
        json={"name": "Nouveau", "emails": []},
        headers=AUTH_ADMIN,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("calendar_token")
    assert len(data["calendar_token"]) == 32


def test_calendar_token_visible_to_self(dbtables):
    """Test that calendar_token is visible to the user themselves."""
    # AUTH_USER is id=8
    resp = client.get("/users/8", headers=AUTH_USER)
    assert resp.status_code == 200
    data = resp.json()
    assert "calendar_token" in data


def test_calendar_token_notvisible_to_admin(dbtables):
    """Test that calendar_token is not visible to admins."""
    with db:
        User.create(id=USER_ID, name="Autre")

    resp = client.get(f"/users/{USER_ID}", headers=AUTH_ADMIN)
    assert resp.status_code == 200
    data = resp.json()
    assert "calendar_token" not in data
