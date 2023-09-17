import pytest
from api.main import app
from api.system import auth_user
from api.pwmodels import Item, User, Loan, db
from fastapi.testclient import TestClient
from conftest import AUTH_ADMIN, AUTH_USER, fake_auth_user

client = TestClient(app)
app.dependency_overrides[auth_user] = fake_auth_user


def test_create_user():
    response = client.post(
        "/users", json={"name": "bob", "email": "bob@nomail"}, headers=AUTH_ADMIN
    )
    assert response.status_code == 200
    newuser = response.json()
    assert "id" in newuser

    # Check in DB
    with db:
        user_db = User.get_by_id(newuser["id"])
        assert user_db.name == "bob"
        assert user_db.email == "bob@nomail"

    # Check in API
    response = client.get(f"/users/{newuser['id']}", headers=AUTH_ADMIN)
    assert response.status_code == 200
    user = response.json()
    assert user["name"] == "bob"
    assert user["email"] == "bob@nomail"


def test_create_user_attributes():
    newjson = {"name": "bob", "email": "bob@nomail", "credit": 3, "role": "admin"}
    response = client.post("/users", json=newjson, headers=AUTH_ADMIN)
    newUser = response.json()

    # Check in API
    response = client.get(f"/users/{newUser['id']}", headers=AUTH_ADMIN)
    User = response.json()
    assert newjson.items() <= User.items()


def test_create_user_invalid_credit():
    newjson = {"name": "bob", "email": "bob@nomail", "credit": -33, "role": "admin"}
    response = client.post("/users", json=newjson, headers=AUTH_ADMIN)
    assert response.status_code == 400

    newjson["credit"] = 40000
    response = client.post("/users", json=newjson, headers=AUTH_ADMIN)
    assert response.status_code == 400


def test_delete_user():
    "Create a user with loans, everything must be removed (except item)"
    response = client.post(
        "/users", json={"name": "bob", "email": "bob@nomail"}, headers=AUTH_ADMIN
    )
    user_id = response.json()["id"]
    response = client.post("/items", json={"name": "obj"}, headers=AUTH_ADMIN)
    item_id = response.json()["id"]
    response = client.post(
        "/loans",
        json={"user": user_id, "items": [item_id], "cost": 0},
        headers=AUTH_ADMIN,
    )
    loan_id = response.json()["loans"][0]["id"]

    # Delete via API
    response = client.delete(f"/users/{user_id}", headers=AUTH_ADMIN)
    assert response.status_code == 200

    # Check in DB
    with db:
        assert not User.get_or_none(User.id == user_id)
        assert not Loan.get_or_none(Loan.id == loan_id)
        assert Item.get_or_none(Item.id == item_id)


def test_delete_unknown_user():
    # Delete via API
    response = client.delete("/users/7", headers=AUTH_ADMIN)
    assert response.status_code == 404


def test_delete_not_authenticated():
    response = client.delete("/users/7")
    assert response.status_code == 403

    response = client.delete("/users/7", headers=AUTH_USER)
    assert response.status_code == 403


@pytest.mark.parametrize(
    ("toedit"),
    ({"name": "newname"}, {"email": "alice@nomail"}, {"role": "operator"}),
)
def test_edit_user_attributes(toedit: dict):
    # Create User
    newjson = {"name": "bob", "email": "bob@nomail", "credit": 3, "role": "admin"}
    response = client.post("/users", json=newjson, headers=AUTH_ADMIN)
    newUser = response.json()

    # Edit with APi
    newjson |= toedit
    response = client.post(f"/users/{newUser['id']}", json=newjson, headers=AUTH_ADMIN)
    assert response.status_code == 200

    # Check in API
    response = client.get(f"/users/{newUser['id']}", headers=AUTH_ADMIN)
    User = response.json()
    assert newjson.items() <= User.items()


def test_get_users():
    # Create Users
    User1 = {"name": "alice", "email": "alice@nomail"}
    User2 = {"name": "bob", "email": "bob@nomail", "credit": 3, "role": "admin"}
    response = client.post("/users", json=User1, headers=AUTH_ADMIN)
    response = client.post("/users", json=User2, headers=AUTH_ADMIN)

    # Check in API
    response = client.get("/users", headers=AUTH_ADMIN)
    users = response.json()
    assert len(users) == 2
    assert User1.items() <= users[0].items()
    assert User2.items() <= users[1].items()

    # Limit get Users to 1 User
    response = client.get("/users?nb=1", headers=AUTH_ADMIN)
    users = response.json()
    assert len(users) == 1
    assert User1.items() <= users[0].items()


def test_get_users_loancount():
    # Create a user without loan
    response = client.post(
        "/users", json={"name": "bob", "email": "bob@nomail"}, headers=AUTH_ADMIN
    )
    user_id = response.json()["id"]

    # Check API
    response = client.get("/users", headers=AUTH_ADMIN)
    user = response.json()[0]
    assert user["loans"] == 0

    # Create a loan
    response = client.post("/items", json={"name": "obj"}, headers=AUTH_ADMIN)
    item_id = response.json()["id"]
    response = client.post(
        "/loans",
        json={"user": user_id, "items": [item_id], "cost": 0},
        headers=AUTH_ADMIN,
    )
    response.json()["loans"][0]["id"]

    # Check API
    response = client.get("/users", headers=AUTH_ADMIN)
    user = response.json()[0]
    assert user["loans"] == 1
