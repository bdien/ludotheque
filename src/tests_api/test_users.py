import pytest
from api.main import app
from api.pwmodels import User, Loan
from fastapi.testclient import TestClient

client = TestClient(app)


def test_create_user():
    response = client.post("/users", json={"name": "bob"})
    assert response.status_code == 200
    newuser = response.json()
    assert "id" in newuser

    # Check in DB
    user_db = User.get_by_id(newuser["id"])
    assert user_db.name == "bob"

    # Check in API
    response = client.get(f"/users/{newuser['id']}")
    assert response.status_code == 200
    user = response.json()
    assert user["name"] == "bob"


def test_create_user_attributes():
    newjson = {"name": "bob", "email": "bob@nomail", "credit": 3, "role": "admin"}
    response = client.post("/users", json=newjson)
    newUser = response.json()

    # Check in API
    response = client.get(f"/users/{newUser['id']}")
    User = response.json()
    assert newjson.items() <= User.items()


def test_delete_user():
    "Create a user with loans, everything must be removed"
    response = client.post("/users", json={"name": "bob"})
    user_id = response.json()["id"]
    response = client.post("/items", json={"name": "obj"})
    item_id = response.json()["id"]
    response = client.post(
        "/loans", json={"user": user_id, "items": [item_id], "cost": 0}
    )
    loan_id = response.json()[0]["id"]

    # Delete via API
    response = client.delete(f"/users/{user_id}")
    assert response.status_code == 200

    # Check in DB
    assert not User.get_or_none(User.id == user_id)
    assert not Loan.get_or_none(Loan.id == loan_id)


def test_delete_unknown_user():
    # Delete via API
    response = client.delete("/users/7")
    assert response.status_code == 404


@pytest.mark.parametrize(
    ("toedit"),
    ({"name": "newname"}, {"email": "alice@nomail"}, {"role": "operator"}),
)
def test_edit_user_attributes(toedit: dict):
    # Create User
    newjson = {"name": "bob", "email": "bob@nomail", "credit": 3, "role": "admin"}
    response = client.post("/users", json=newjson)
    newUser = response.json()

    # Edit with APi
    newjson |= toedit
    response = client.post(f"/users/{newUser['id']}", json=newjson)
    assert response.status_code == 200

    # Check in API
    response = client.get(f"/users/{newUser['id']}")
    User = response.json()
    assert newjson.items() <= User.items()


def test_get_users():
    # Create Users
    User1 = {"name": "bob", "email": "bob@nomail", "credit": 3, "role": "admin"}
    User2 = {"name": "alice", "email": "alice@nomail"}
    response = client.post("/users", json=User1)
    response = client.post("/users", json=User2)

    # Check in API
    response = client.get("/users")
    users = response.json()
    assert len(users) == 2
    assert User1.items() <= users[0].items()
    assert User2.items() <= users[1].items()

    # Limit get Users to 1 User
    response = client.get("/users?nb=1")
    users = response.json()
    assert len(users) == 1
    assert User1.items() <= users[0].items()
