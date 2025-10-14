import pytest
from conftest import AUTH_ADMIN, AUTH_USER, fake_auth_user
from fastapi.testclient import TestClient

from api.main import app
from api.pwmodels import EMail, Item, Loan, User, db
from api.system import auth_user

client = TestClient(app)
app.dependency_overrides[auth_user] = fake_auth_user


def test_create_user():
    response = client.post(
        "/users",
        json={"name": "bob", "emails": ["bob@nomail", "bab@nomail"]},
        headers=AUTH_ADMIN,
    )
    assert response.status_code == 200
    newuser = response.json()
    assert "id" in newuser

    # Check in DB
    with db:
        user_db = User.get_by_id(newuser["id"])
        assert user_db.name == "bob"
        email_db = EMail.get(email="bob@nomail")
        assert email_db.user == user_db

    # Check in API
    response = client.get(f"/users/{newuser['id']}", headers=AUTH_ADMIN)
    assert response.status_code == 200
    user = response.json()
    assert user["name"] == "bob"
    assert user["emails"] == ["bob@nomail", "bab@nomail"]


def test_create_user_attributes():
    newjson = {"name": "bob", "emails": ["bob@nomail"], "credit": 3, "role": "admin"}
    response = client.post("/users", json=newjson, headers=AUTH_ADMIN)
    newUser = response.json()

    # Check in API
    response = client.get(f"/users/{newUser['id']}", headers=AUTH_ADMIN)
    User = response.json()
    assert newjson.items() <= User.items()


def test_create_user_invalid_credit():
    newjson = {"name": "bob", "credit": -33, "role": "admin"}
    response = client.post("/users", json=newjson, headers=AUTH_ADMIN)
    assert response.status_code == 400

    newjson["credit"] = 40000
    response = client.post("/users", json=newjson, headers=AUTH_ADMIN)
    assert response.status_code == 400


def test_delete_user():
    "Create a user with loans, everything must be replaced by NULL (except item)"
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
        loan = Loan.get_or_none(Loan.id == loan_id)
        assert loan.user_id is None
        assert not EMail.get_or_none(EMail.email == "bob@nomail")
        assert Item.get_or_none(Item.id == item_id)


def test_delete_unknown_user():
    # Delete via API
    response = client.delete("/users/7", headers=AUTH_ADMIN)
    assert response.status_code == 404


def test_delete_not_authenticated():
    response = client.delete("/users/7")
    assert response.status_code == 401

    response = client.delete("/users/7", headers=AUTH_USER)
    assert response.status_code == 403


@pytest.mark.parametrize(
    ("toedit"),
    [{"name": "newname"}, {"emails": ["alice@nomail"]}, {"role": "operator"}],
)
def test_edit_user_attributes(toedit: dict):
    # Create User
    newjson = {"name": "bob", "emails": ["bob@nomail"], "credit": 3, "role": "admin"}
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
    User1 = {"name": "alice", "emails": ["2@nomail", "alice@nomail"]}
    User2 = {"name": "bob", "emails": ["bob@nomail"], "credit": 3, "role": "admin"}
    response = client.post("/users", json=User1, headers=AUTH_ADMIN)
    response = client.post("/users", json=User2, headers=AUTH_ADMIN)

    # Check in API
    response = client.get("/users", headers=AUTH_ADMIN)
    users = response.json()
    import json

    # Email order causing issues
    del User1["emails"]

    print(json.dumps(users, indent=2))
    assert len(users) == 4  # 2 already created in conftest
    assert set(users[1]["emails"]) == {"2@nomail", "alice@nomail"}
    assert User1.items() <= users[1].items()
    assert User2.items() <= users[2].items()

    # Limit get Users to 1 User
    response = client.get("/users?nb=1", headers=AUTH_ADMIN)
    users = response.json()
    assert len(users) == 1


@pytest.mark.parametrize("pattern", ["Hélène", "helen", "len"])
def test_search_users(pattern):
    User1 = {"name": "Hélène", "email": "alice@nomail"}
    User2 = {"name": "bob", "email": "bob@nomail", "credit": 3, "role": "admin"}
    response = client.post("/users", json=User1, headers=AUTH_ADMIN)
    response = client.post("/users", json=User2, headers=AUTH_ADMIN)

    # Check in API
    response = client.get(f"/users?q={pattern}", headers=AUTH_ADMIN)
    users = response.json()
    assert len(users) == 1
    assert users[0]["name"] == "Hélène"

    # Check in API, QuickSearch
    response = client.get(f"/users/search?q={pattern}", headers=AUTH_ADMIN)
    users = response.json()
    assert len(users) == 1
    assert users[0]["name"] == "Hélène"


def test_get_users_loancount():
    # Create a user without loan
    response = client.post(
        "/users", json={"name": "bob", "email": "bob@nomail"}, headers=AUTH_ADMIN
    )
    user_id = response.json()["id"]

    # Check API
    response = client.get(f"/users/{user_id}", headers=AUTH_ADMIN)
    user = response.json()
    assert len(user["loans"]) == 0

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
    response = client.get(f"/users/{user_id}", headers=AUTH_ADMIN)
    user = response.json()
    assert len(user["loans"]) == 1


def test_user_use_lowest_id():
    "Check if lowest possible ID is used"

    # 1 is already created

    newjson = {"name": "A", "email": "A"}
    response = client.post("/users", json=newjson, headers=AUTH_ADMIN)
    newUser = response.json()
    assert newUser["id"] == 2

    newjson = {"name": "B", "email": "B"}
    response = client.post("/users", json=newjson, headers=AUTH_ADMIN)
    newUser = response.json()
    assert newUser["id"] == 3

    newjson = {"name": "D", "email": "D"}
    response = client.post("/users", json=newjson, headers=AUTH_ADMIN)
    newUser = response.json()
    assert newUser["id"] == 4

    with db:
        User.delete().where(User.id == 2).execute()

    newjson = {"name": "E", "email": "E"}
    response = client.post("/users", json=newjson, headers=AUTH_ADMIN)
    newUser = response.json()
    assert newUser["id"] == 2
