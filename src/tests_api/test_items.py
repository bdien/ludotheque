import datetime
import pytest
from api.main import app
from api.system import auth_user
from api.pwmodels import Booking, Category, Item, ItemCategory, ItemLink, Loan, User, db
from fastapi.testclient import TestClient
from conftest import AUTH_ADMIN, AUTH_USER, fake_auth_user
from tests_api.conftest import AUTH_USER_ID

client = TestClient(app)
app.dependency_overrides[auth_user] = fake_auth_user


def test_create_item():
    response = client.post("/items", json={"name": "objet"}, headers=AUTH_ADMIN)
    assert response.status_code == 200
    newitem = response.json()
    assert "id" in newitem

    # Check in DB
    with db:
        item_db = Item.get_by_id(newitem["id"])
        assert item_db.name == "objet"

    # Check in API
    response = client.get(f"/items/{newitem['id']}")
    assert response.status_code == 200
    item = response.json()
    assert item["name"] == "objet"


def test_create_item_attributes():
    newjson = {
        "name": "objet",
        "age": 10,
        "players_min": 2,
        "players_max": 7,
        "description": "Desc",
    }
    response = client.post("/items", json=newjson, headers=AUTH_ADMIN)
    newitem = response.json()

    # Check in API
    response = client.get(f"/items/{newitem['id']}")
    item = response.json()
    assert newjson.items() <= item.items()


@pytest.mark.parametrize("big", [True, False])
@pytest.mark.parametrize("outside", [True, False])
def test_create_item_bigoutside(big, outside):
    response = client.post(
        "/items",
        json={"name": "objet", "big": big, "outside": outside},
        headers=AUTH_ADMIN,
    )
    newitem = response.json()

    # Check in API
    response = client.get(f"/items/{newitem['id']}")
    item = response.json()
    assert item["big"] == big
    assert item["outside"] == outside


def test_delete_item_not_authenticated():
    response = client.delete("/items/0")
    assert response.status_code == 401

    response = client.delete("/items/0", headers=AUTH_USER)
    assert response.status_code == 403


def test_delete_item():
    "Try to delete a loaned object"
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
    print(response.json())
    loan_id = response.json()["loans"][0]["id"]

    # Delete via API
    response = client.delete(f"/items/{item_id}", headers=AUTH_ADMIN)
    assert response.status_code == 200

    # Check in DB
    with db:
        assert not Item.get_or_none(id=item_id)
        assert not Loan.get_or_none(id=loan_id)
        assert User.get_or_none(id=item_id)


def test_delete_unknown_item():
    # Delete via API
    response = client.delete("/items/7", headers=AUTH_ADMIN)
    assert response.status_code == 404


@pytest.mark.parametrize(
    ("toedit"),
    [
        {"name": "newname"},
        {"description": "newdesc"},
        {"players_min": 1},
        {"players_max": 16},
        {"age": 4},
        {"big": True},
        {"outside": True},
    ],
)
def test_edit_item_attributes(toedit: dict):
    # Create item
    newjson = {
        "name": "objet",
        "age": 10,
        "players_min": 2,
        "players_max": 7,
        "description": "Desc",
    }
    response = client.post("/items", json=newjson, headers=AUTH_ADMIN)
    newitem = response.json()

    # Edit with APi
    newjson |= toedit
    response = client.post(f"/items/{newitem['id']}", json=newjson, headers=AUTH_ADMIN)
    assert response.status_code == 200

    # Check in API
    response = client.get(f"/items/{newitem['id']}")
    item = response.json()
    assert newjson.items() <= item.items()


def test_get_items():
    # Create items
    item1 = {"name": "obj1", "age": 10, "players_min": 2, "players_max": 7}
    item2 = {"name": "obj2", "age": 5}
    response = client.post("/items", json=item1, headers=AUTH_ADMIN)
    response = client.post("/items", json=item2, headers=AUTH_ADMIN)

    # Check in API
    response = client.get("/items")
    items = response.json()
    assert len(items) == 2
    assert item1.items() <= items[0].items()
    assert item2.items() <= items[1].items()

    # Limit get items to 1 item
    response = client.get("/items?nb=1")
    items = response.json()
    assert len(items) == 1
    assert item1.items() <= items[0].items()


def test_get_items_loaned():
    yesterday = datetime.date.today() - datetime.timedelta(days=1)
    tomorrow = datetime.date.today() + datetime.timedelta(days=1)
    with db:
        item1 = Item.create(name="item1")
        item2 = Item.create(name="item2")
        user = User.create(name="user")
        Loan.create(user=user, item=item1, start=yesterday, stop=yesterday, status="in")
        Loan.create(user=user, item=item2, start=yesterday, stop=tomorrow, status="out")

    # Check in API
    response = client.get("/items")
    items = response.json()
    assert items[0]["name"] == "item1"
    assert items[0]["status"] != "out"
    assert items[1]["name"] == "item2"
    assert items[1]["status"] == "out"


def test_get_items_bookings():
    with db:
        item = Item.create(id=5, name="item1")
        user = User.get(id=AUTH_USER_ID)
        Booking.create(user=user, item=item)

    # Check in API (Non-auth user)
    response = client.get(f"/items/{item.id}").json()
    assert response["bookings"] == {"nb": 1}
    assert response["bookings"]["nb"] == 1
    assert "entries" not in response["bookings"]

    # Normal user
    response = client.get(f"/items/{item.id}", headers=AUTH_USER).json()
    assert response["bookings"]["nb"] == 1
    assert "entries" in response["bookings"]
    assert len(response["bookings"]["entries"]) == 1
    entry = response["bookings"]["entries"][0]
    assert entry["user"] == user.id

    # Admin user
    response = client.get(f"/items/{item.id}", headers=AUTH_ADMIN).json()
    assert response["bookings"]["nb"] == 1
    assert len(response["bookings"]["entries"]) == 1
    entry = response["bookings"]["entries"][0]
    assert entry["user"] == user.id


def test_modif_category():
    with db:
        item = Item.create(name="obj")
        Category.create(id=1, name="cat1")
        Category.create(id=2, name="cat2")

    # Only one category
    response = client.post(
        f"/items/{item.id}", json={"categories": [1]}, headers=AUTH_ADMIN
    )
    assert response.status_code == 200
    with db:
        cats = [
            i.category_id
            for i in ItemCategory.select().where(ItemCategory.item == item)
        ]
    assert cats == [1]

    # Add a second one
    response = client.post(
        f"/items/{item.id}", json={"categories": [1, 2]}, headers=AUTH_ADMIN
    )
    assert response.status_code == 200
    with db:
        cats = [
            i.category_id
            for i in ItemCategory.select().where(ItemCategory.item == item)
        ]
    assert cats == [1, 2]

    # Now remove the first one
    response = client.post(
        f"/items/{item.id}", json={"categories": [2]}, headers=AUTH_ADMIN
    )
    assert response.status_code == 200
    with db:
        cats = [
            i.category_id
            for i in ItemCategory.select().where(ItemCategory.item == item)
        ]
    assert cats == [2]


def test_modif_links():
    with db:
        item = Item.create(name="obj")

    # Only one link
    response = client.post(
        f"/items/{item.id}",
        json={"links": [{"name": "1", "ref": 1}]},
        headers=AUTH_ADMIN,
    )
    assert response.status_code == 200
    with db:
        links = [i.name for i in ItemLink.select().where(ItemLink.item == item)]
        assert links == ["1"]

    # Add a second one
    response = client.post(
        f"/items/{item.id}",
        json={"links": [{"name": "1", "ref": 1}, {"name": "2", "ref": 2}]},
        headers=AUTH_ADMIN,
    )
    assert response.status_code == 200
    with db:
        links = [i.name for i in ItemLink.select().where(ItemLink.item == item)]
        assert links == ["1", "2"]

    # Now remove the first one
    response = client.post(
        f"/items/{item.id}",
        json={"links": [{"name": "2", "ref": 2}]},
        headers=AUTH_ADMIN,
    )
    assert response.status_code == 200

    with db:
        links = [i.name for i in ItemLink.select().where(ItemLink.item == item)]
        assert links == ["2"]
