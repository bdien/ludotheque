from api.main import app
from api.system import auth_user
from api.pwmodels import Ledger, User, Item, db
from api.config import PRICING
from fastapi.testclient import TestClient
from conftest import AUTH_ADMIN, fake_auth_user


client = TestClient(app)
app.dependency_overrides[auth_user] = fake_auth_user


def test_ledger_nocredit():
    with db:
        user = User.create(name="Bob", email="bob", credit=0)
        item_big = Item.create(name="big", big=True)
        item_reg = Item.create(name="reg", big=False)

    client.post(
        "/loans",
        json={"user": user.id, "items": [item_big.id, item_reg.id]},
        headers=AUTH_ADMIN,
    )

    # Check in DB
    with db:
        assert Ledger.get(item_id=item_big.id).cost == PRICING["big"]
        assert Ledger.get(item_id=item_big.id).money == PRICING["big"]
        assert Ledger.get(item_id=item_reg.id).cost == PRICING["regular"]
        assert Ledger.get(item_id=item_reg.id).money == PRICING["regular"]


def test_ledger_credit():
    "User has a lot of credit remaining, entry in ledger should be 0"
    with db:
        user = User.create(name="Bob", email="bob", credit=1)
        item_r1 = Item.create(name="reg1")
        item_r2 = Item.create(name="reg2")

    client.post(
        "/loans",
        json={"user": user.id, "items": [item_r1.id, item_r2.id]},
        headers=AUTH_ADMIN,
    )

    # Check in DB
    with db:
        assert Ledger.get(item_id=item_r1.id).cost == PRICING["regular"]
        assert Ledger.get(item_id=item_r1.id).money == 0
        assert Ledger.get(item_id=item_r2.id).cost == PRICING["regular"]
        assert Ledger.get(item_id=item_r2.id).money == 0


def test_ledger_somecredit():
    "User has a some credit remaining, entry in ledger should be partially 0"
    with db:
        user = User.create(name="Bob", email="bob", credit=PRICING["regular"])
        item_r1 = Item.create(name="reg1")
        item_r2 = Item.create(name="reg2")

    client.post(
        "/loans",
        json={"user": user.id, "items": [item_r1.id, item_r2.id]},
        headers=AUTH_ADMIN,
    )

    # Check in DB
    with db:
        assert Ledger.get(item_id=item_r1.id).cost == PRICING["regular"]
        assert Ledger.get(item_id=item_r1.id).money == 0
        assert Ledger.get(item_id=item_r2.id).cost == PRICING["regular"]
        assert Ledger.get(item_id=item_r2.id).money == PRICING["regular"]


def test_ledger_partialcredit():
    "User has a some credit remaining, not enough to cover a big item"
    with db:
        user = User.create(name="Bob", email="bob", credit=2)
        item_b1 = Item.create(name="big1", big=True)
        item_r2 = Item.create(name="reg2")

    client.post(
        "/loans",
        json={"user": user.id, "items": [item_b1.id, item_r2.id]},
        headers=AUTH_ADMIN,
    )

    # Check in DB
    with db:
        assert Ledger.get(item_id=item_b1.id).cost == PRICING["big"]
        assert Ledger.get(item_id=item_b1.id).money == PRICING["big"] - 2
        assert Ledger.get(item_id=item_r2.id).cost == PRICING["regular"]
        assert Ledger.get(item_id=item_r2.id).money == PRICING["regular"]


def test_ledger_yearly():
    with db:
        user = User.create(name="Bob", email="bob", credit=100)

    client.post("/loans", json={"user": user.id, "items": [-1]}, headers=AUTH_ADMIN)

    with db:
        assert Ledger.get(item_id=-1).cost == PRICING["yearly"]
        assert Ledger.get(item_id=-1).money == PRICING["yearly"]


def test_ledger_card():
    with db:
        user = User.create(name="Bob", email="bob", credit=100)

    client.post("/loans", json={"user": user.id, "items": [-2]}, headers=AUTH_ADMIN)

    with db:
        assert Ledger.get(item_id=-2).cost == PRICING["card"]
        assert Ledger.get(item_id=-2).money == PRICING["card"]
