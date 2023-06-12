import pytest
from api.main import app
from api.pwmodels import Item
from fastapi.testclient import TestClient

client = TestClient(app)


def test_create_item():
    response = client.post(
        "/items",
        json={"name": "objet"},
    )
    assert response.status_code == 200
    newitem = response.json()
    assert "id" in newitem

    # Check in DB
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
    response = client.post(
        "/items",
        json=newjson,
    )
    newitem = response.json()

    # Check in API
    response = client.get(f"/items/{newitem['id']}")
    item = response.json()
    assert newjson.items() <= item.items()


@pytest.mark.parametrize("big", (True, False))
@pytest.mark.parametrize("outside", (True, False))
def test_create_item_bigoutside(big, outside):
    response = client.post(
        "/items",
        json={"name": "objet", "big": big, "outside": outside},
    )
    newitem = response.json()

    # Check in API
    response = client.get(f"/items/{newitem['id']}")
    item = response.json()
    assert item["big"] == big
    assert item["outside"] == outside


@pytest.mark.parametrize(
    ("toedit"),
    (
        {"name": "newname"},
        {"description": "newdesc"},
        {"players_min": 1},
        {"players_max": 16},
        {"age": 4},
        {"big": True},
        {"outside": True},
    ),
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
    response = client.post(
        "/items",
        json=newjson,
    )
    newitem = response.json()

    # Edit with APi
    newjson |= toedit
    response = client.post(f"/items/{newitem['id']}", json=newjson)
    assert response.status_code == 200

    # Check in API
    response = client.get(f"/items/{newitem['id']}")
    item = response.json()
    assert newjson.items() <= item.items()


def test_get_items():
    # Create items
    item1 = {"name": "obj1", "age": 10, "players_min": 2, "players_max": 7}
    item2 = {"name": "obj2", "description": "Desc"}
    response = client.post("/items", json=item1)
    response = client.post("/items", json=item2)

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
