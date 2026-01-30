import datetime

import pytest
from conftest import AUTH_ADMIN, AUTH_USER, fake_auth_user
from fastapi.testclient import TestClient

from api.config import PRICING
from api.main import app
from api.pwmodels import Item, Loan, User, db
from api.system import auth_user

client = TestClient(app)
app.dependency_overrides[auth_user] = fake_auth_user

USER_ID = 66
ITEM_ID = 158
TODAY = datetime.date.today()


@pytest.fixture
def dbitems():
    "Create basic DB items"
    with db:
        u = User.create(id=USER_ID, name="User", email="user@email", credit=1)
        i = Item.create(id=ITEM_ID, name="Item")
    return {"user": u, "items": [i]}


def test_create_loan(dbitems):
    response = client.post(
        "/loans",
        json={"user": USER_ID, "items": [ITEM_ID]},
        headers=AUTH_ADMIN,
    )
    assert response.status_code == 200

    # Check Item status
    response = client.get(f"/items/{ITEM_ID}")
    assert response.status_code == 200
    item = response.json()
    assert item["status"] == "out"

    # Check item in user loans
    response = client.get(f"/users/{USER_ID}", headers=AUTH_ADMIN)
    assert response.status_code == 200
    user = response.json()
    assert user["loans"][0]["item"] == ITEM_ID
    loan_id = user["loans"][0]["id"]

    # Check Loan status of loan
    response = client.get(f"/loans/{loan_id}", headers=AUTH_ADMIN)
    assert response.status_code == 200
    assert response.json()["status"] == "out"


def test_create_loan_twice(dbitems):
    "Try to loan the same object twice at the same time"

    response = client.post(
        "/loans",
        json={"user": USER_ID, "items": [ITEM_ID]},
        headers=AUTH_ADMIN,
    )
    assert response.status_code == 200
    loan_id = response.json()["loans"][0]["id"]

    response = client.post(
        "/loans",
        json={"user": USER_ID, "items": [ITEM_ID]},
        headers=AUTH_ADMIN,
    )
    assert response.status_code != 200

    # Return the object, should work now
    client.post(f"/loans/{loan_id}/close", headers=AUTH_ADMIN)
    response = client.post(
        "/loans",
        json={"user": USER_ID, "items": [ITEM_ID]},
        headers=AUTH_ADMIN,
    )
    assert response.status_code == 200


def test_create_loan_item_from_other_user(dbitems):
    "Try to loan the object already loaned to another user (should work)"

    response = client.post(
        "/loans",
        json={"user": USER_ID, "items": [ITEM_ID]},
        headers=AUTH_ADMIN,
    )
    assert response.status_code == 200

    with db:
        u = User.create(name="User2", email="user2@email", credit=1)
    response = client.post(
        "/loans",
        json={"user": u.id, "items": [ITEM_ID]},
        headers=AUTH_ADMIN,
    )
    assert response.status_code == 200

    # Check in DB
    with db:
        assert Loan.get(user=USER_ID, item=ITEM_ID).status == "in"
        assert Loan.get(user=u.id, item=ITEM_ID).status == "out"


def test_create_loan_not_authenticated(dbitems):
    response = client.post("/loans", json={"user": USER_ID})
    assert response.status_code >= 400

    response = client.post("/loans", json={"user": USER_ID}, headers=AUTH_USER)
    assert response.status_code >= 400


def test_close_loan(dbitems):
    # Create loan
    response = client.post(
        "/loans",
        json={"user": USER_ID, "items": [ITEM_ID]},
        headers=AUTH_ADMIN,
    )

    # Check item in user loans
    response = client.get(f"/users/{USER_ID}", headers=AUTH_ADMIN)
    user = response.json()
    loan_id = user["loans"][0]["id"]

    # Try to close it
    response = client.post(f"/loans/{loan_id}/close", headers=AUTH_ADMIN)
    assert response.status_code == 200

    # Check status of loan
    response = client.get(f"/loans/{loan_id}", headers=AUTH_ADMIN)
    assert response.status_code == 200
    assert response.json()["status"] == "in"

    # Check item in user loans
    response = client.get(f"/users/{USER_ID}", headers=AUTH_ADMIN)
    user = response.json()
    assert not user.get("loans")


def test_delete_loan():
    "Create a user with loans, everything must be removed"
    response = client.post(
        "/users", json={"name": "bob", "email": "bob@nomail"}, headers=AUTH_ADMIN
    )
    user_id = response.json()["id"]
    response = client.post("/items", json={"name": "obj"}, headers=AUTH_ADMIN)
    item_id = response.json()["id"]
    response = client.post(
        "/loans",
        json={"user": user_id, "items": [item_id]},
        headers=AUTH_ADMIN,
    )
    loan_id = response.json()["loans"][0]["id"]

    # Delete via API
    response = client.delete(f"/loans/{loan_id}", headers=AUTH_ADMIN)
    assert response.status_code == 200

    # Check in DB
    with db:
        assert not Loan.get_or_none(Loan.id == loan_id)
        assert Item.get_or_none(Item.id == item_id)
        assert User.get_or_none(User.id == user_id)


def test_loan_cost():
    with db:
        user = User.create(name="Bob", email="bob", credit=10)
        item_big = Item.create(name="big", big=True)
        item_reg = Item.create(name="reg", big=False)

    response = client.post(
        "/loans",
        json={"user": user.id, "items": [item_big.id, item_reg.id]},
        headers=AUTH_ADMIN,
    ).json()

    # Check costs

    assert response["cost"] == PRICING["big"] + PRICING["regular"]

    # Check in DB
    with db:
        assert User.get(id=user).credit == 10 - PRICING["big"] - PRICING["regular"]


def test_loan_subscription():
    with db:
        user = User.create(name="Bob", email="bob", credit=100)

    response = client.post(
        "/loans",
        json={"user": user.id, "items": [-1]},
        headers=AUTH_ADMIN,
    ).json()

    assert response == {
        "cost": PRICING["yearly"],
        "items_cost": [PRICING["yearly"]],
        "topay": {"credit": 0, "real": PRICING["yearly"]},
        "new_credit": 100,
        "loans": [],
    }


def test_loan_subscription_will_reenable_user():
    with db:
        user = User.create(name="Bob", email="bob", credit=100, enabled=False)

    client.post(
        "/loans",
        json={"user": user.id, "items": [-1]},
        headers=AUTH_ADMIN,
    ).json()

    with db:
        user = User.get_by_id(user.id)
        assert user.enabled


@pytest.mark.parametrize(
    ("origdate", "finaldate"),
    [
        (TODAY - datetime.timedelta(days=60), TODAY + datetime.timedelta(days=366)),
        (TODAY, TODAY + datetime.timedelta(days=366)),
        (TODAY + datetime.timedelta(days=100), TODAY + datetime.timedelta(days=466)),
    ],
)
def test_loan_subscription_finaldate(origdate, finaldate):
    "Check with date in past, None and future"
    with db:
        user = User.create(name="Bob", email="bob", subscription=origdate)

    client.post("/loans", json={"user": user.id, "items": [-1]}, headers=AUTH_ADMIN)

    with db:
        user = User.get(id=user.id)
        assert user.subscription == finaldate


def test_loan_fillcard():
    with db:
        user = User.create(name="Bob", email="bob", credit=100)

    response = client.post(
        "/loans",
        json={"user": user.id, "items": [-2]},
        headers=AUTH_ADMIN,
    ).json()

    assert response == {
        "cost": PRICING["card"],
        "items_cost": [PRICING["card"]],
        "topay": {"credit": 0, "real": PRICING["card"]},
        "new_credit": 100 + PRICING["card_value"],
        "loans": [],
    }

    with db:
        newuser = User.get(name="Bob")
        assert newuser.credit == 100 + PRICING["card_value"]


def test_loan_fillcard_simulation():
    with db:
        user = User.create(name="Bob", email="bob", credit=100)

    response = client.post(
        "/loans",
        json={"user": user.id, "items": [-2], "simulation": True},
        headers=AUTH_ADMIN,
    ).json()

    assert response == {
        "cost": PRICING["card"],
        "items_cost": [PRICING["card"]],
        "topay": {"credit": 0, "real": PRICING["card"]},
        "new_credit": 100 + PRICING["card_value"],
        "loans": [],
    }

    with db:
        newuser = User.get(name="Bob")
        assert newuser.credit == 100


def test_loan_fillcard_plus_subscription():
    with db:
        user = User.create(name="Bob", email="bob", credit=100)

    response = client.post(
        "/loans",
        json={"user": user.id, "items": [-1, -2]},
        headers=AUTH_ADMIN,
    ).json()

    assert response == {
        "cost": PRICING["yearly"] + PRICING["card"],
        "items_cost": [PRICING["yearly"], PRICING["card"]],
        "topay": {"credit": 0, "real": PRICING["yearly"] + PRICING["card"]},
        "new_credit": 100 + PRICING["card_value"],
        "loans": [],
    }


def test_loan_fillcard_plus_item():
    with db:
        user = User.create(name="Bob", email="bob", credit=1)  # User starts with 1
        item_big = Item.create(name="big", big=True)

    response = client.post(
        "/loans",
        json={"user": user.id, "items": [item_big.id, -2]},  # Item + Subscription
        headers=AUTH_ADMIN,
    ).json()

    # Check there is a loan, and remove it for comparison
    assert response["loans"]
    response["loans"] = []

    assert response == {
        "cost": PRICING["big"] + PRICING["card"],
        "items_cost": [PRICING["big"], PRICING["card"]],
        "topay": {"credit": PRICING["big"], "real": PRICING["card"]},
        "new_credit": 1 + PRICING["card_value"] - PRICING["big"],
        "loans": [],
    }

    with db:
        newuser = User.get(name="Bob")
        assert newuser.credit == 1 + PRICING["card_value"] - PRICING["big"]


def test_loan_fillcard_benevole():
    with db:
        user = User.create(name="Bob", email="bob", role="benevole", credit=1)
        item_big = Item.create(name="big", big=True)

    response = client.post(
        "/loans",
        json={"user": user.id, "items": [item_big.id, -2]},  # Item + Subscription
        headers=AUTH_ADMIN,
    ).json()

    # Check there is a loan, and remove it for comparison
    assert response["loans"]
    response["loans"] = []

    assert response == {
        "cost": PRICING["card"],
        "items_cost": [0, PRICING["card"]],
        "topay": {"credit": 0, "real": PRICING["card"]},
        "new_credit": 1 + PRICING["card_value"],
        "loans": [],
    }

    with db:
        newuser = User.get(name="Bob")
        assert newuser.credit == 1 + PRICING["card_value"]


def test_loan_fillcard_admin():
    with db:
        user = User.create(name="Bob", email="bob", role="admin", credit=1)
        item_big = Item.create(name="big", big=True)

    response = client.post(
        "/loans",
        json={"user": user.id, "items": [item_big.id, -2]},  # Item + Subscription
        headers=AUTH_ADMIN,
    ).json()

    # Check there is a loan, and remove it for comparison
    assert response["loans"]
    response["loans"] = []

    assert response == {
        "cost": PRICING["card"],
        "items_cost": [0, PRICING["card"]],
        "topay": {"credit": 0, "real": PRICING["card"]},
        "new_credit": 1 + PRICING["card_value"],
        "loans": [],
    }

    with db:
        newuser = User.get(name="Bob")
        assert newuser.credit == 1 + PRICING["card_value"]
