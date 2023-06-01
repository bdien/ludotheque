import pytest
from api.main import app
from api.pwmodels import User, Item
from fastapi.testclient import TestClient

client = TestClient(app)


USER_ID = 66
ITEM_ID = 158


@pytest.fixture()
def dbitems():
    "Create basic DB items"
    u = User.create(id=USER_ID, name="User", credit=1)
    i = Item.create(id=ITEM_ID, name="Item")
    yield {"user": u, "items": [i]}


def test_create_loan(dbitems):
    response = client.post(
        "/loans",
        json={"user": USER_ID, "items": [ITEM_ID], "cost": 2},
    )
    assert response.status_code == 200

    # Check Item status
    response = client.get(f"/items/{ITEM_ID}")
    assert response.status_code == 200
    item = response.json()
    assert item["status"] == "out"

    # Check item in user loans
    response = client.get(f"/users/{USER_ID}")
    assert response.status_code == 200
    user = response.json()
    assert user["loans"][0]["item"] == ITEM_ID
    loan_id = user["loans"][0]["id"]

    # Check Loan status of loan
    response = client.get(f"/loans/{loan_id}")
    assert response.status_code == 200
    assert response.json()["status"] == "out"


def test_close_loan(dbitems):
    # Create loan
    response = client.post(
        "/loans",
        json={"user": USER_ID, "items": [ITEM_ID], "cost": 2},
    )

    # Check item in user loans
    response = client.get(f"/users/{USER_ID}")
    user = response.json()
    loan_id = user["loans"][0]["id"]

    # Try to close it
    response = client.get(f"/loans/{loan_id}/close")
    assert response.status_code == 200

    # Check status of loan
    response = client.get(f"/loans/{loan_id}")
    assert response.status_code == 200
    assert response.json()["status"] == "in"

    # Check item in user loans
    response = client.get(f"/users/{USER_ID}")
    user = response.json()
    assert not user["loans"]
