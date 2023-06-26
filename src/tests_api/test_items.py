import io
import os
import pytest
from api.main import app
from api.system import auth_user
from api.pwmodels import Item, Loan, ItemPicture, User
from fastapi.testclient import TestClient
from conftest import AUTH_ADMIN, AUTH_USER, fake_auth_user

client = TestClient(app)
app.dependency_overrides[auth_user] = fake_auth_user

IMG_FILE = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x03\x02\x02\x02\x02\x02\x03\x02\x02\x02\x03\x03\x03\x03\x04\x06\x04\x04\x04\x04\x04\x08\x06\x06\x05\x06\t\x08\n\n\t\x08\t\t\n\x0c\x0f\x0c\n\x0b\x0e\x0b\t\t\r\x11\r\x0e\x0f\x10\x10\x11\x10\n\x0c\x12\x13\x12\x10\x13\x0f\x10\x10\x10\xff\xc9\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xcc\x00\x06\x00\x10\x10\x05\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xd2\xcf \xff\xd9"


def test_create_item():
    response = client.post("/items", json={"name": "objet"}, headers=AUTH_ADMIN)
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
    response = client.post("/items", json=newjson, headers=AUTH_ADMIN)
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
    assert response.status_code == 403

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
    loan_id = response.json()[0]["id"]

    # Delete via API
    response = client.delete(f"/items/{item_id}", headers=AUTH_ADMIN)
    assert response.status_code == 200

    # Check in DB
    assert not Item.get_or_none(id=item_id)
    assert not Loan.get_or_none(id=loan_id)
    assert User.get_or_none(id=item_id)


def test_delete_unknown_item():
    # Delete via API
    response = client.delete("/items/7", headers=AUTH_ADMIN)
    assert response.status_code == 404


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
    item2 = {"name": "obj2", "description": "Desc"}
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


def test_item_add_picture(fakestorage):
    "Add two pictures, it should avoid the index 1"
    item = Item.create(name="jeu")
    ItemPicture.create(item=item, index=1, filename="test.jpg")
    f = io.BytesIO(IMG_FILE)

    # Create the first one
    response = client.post(
        f"/items/{item.id}/picture",
        files={"file": ("filename", f, "image/jpeg")},
        headers=AUTH_ADMIN,
    )
    assert response.status_code == 200

    assert os.path.isfile(
        f"{fakestorage}/img/jeu_b2bb8775b7d5bf59c36c8637293a4602.webp"
    )
    ItemPicture.get(item=item, index=0)

    # Now create a second one
    response = client.post(
        f"/items/{item.id}/picture",
        files={"file": ("filename", f, "image/jpeg")},
        headers=AUTH_ADMIN,
    )
    assert response.status_code == 200
    ItemPicture.get(item=item, index=2)


def test_item_modify_picture(fakestorage):
    item = Item.create(name="jeu")

    with open(f"{fakestorage}/img/none.jpg", "w") as f:
        f.write("0")
    ItemPicture.create(item=item, index=0, filename="none.jpg")

    f = io.BytesIO(IMG_FILE)
    response = client.post(
        f"/items/{item.id}/picture/0",
        files={"file": ("filename", f, "image/jpeg")},
        headers=AUTH_ADMIN,
    )
    assert response.status_code == 200

    assert os.path.isfile(
        f"{fakestorage}/img/jeu_b2bb8775b7d5bf59c36c8637293a4602.webp"
    )
    assert not os.path.isfile(f"{fakestorage}/img/none.jpg")
    item = ItemPicture.get(item=item, index=0)
    assert item.filename == "jeu_b2bb8775b7d5bf59c36c8637293a4602.webp"


def test_item_modify_picture_nonexistent(fakestorage):
    item = Item.create(name="jeu")

    f = io.BytesIO(IMG_FILE)
    response = client.post(
        f"/items/{item.id}/picture/0",
        files={"file": ("filename", f, "image/jpeg")},
        headers=AUTH_ADMIN,
    )
    assert response.status_code == 200

    assert os.path.isfile(
        f"{fakestorage}/img/jeu_b2bb8775b7d5bf59c36c8637293a4602.webp"
    )
    item = ItemPicture.get(item=item, index=0)
    assert item.filename == "jeu_b2bb8775b7d5bf59c36c8637293a4602.webp"


def test_picture_remove_existent(fakestorage):
    item = Item.create(name="jeu")

    f = io.BytesIO(IMG_FILE)
    response = client.post(
        f"/items/{item.id}/picture",
        files={"file": ("filename", f, "image/jpeg")},
        headers=AUTH_ADMIN,
    )

    response = client.delete(f"/items/{item.id}/picture/0", headers=AUTH_ADMIN)
    assert response.status_code == 200
    assert not os.path.isfile(
        f"{fakestorage}/img/jeu_b2bb8775b7d5bf59c36c8637293a4602.webp"
    )
    assert not ItemPicture.get_or_none(item=item, index=1)


def test_picture_remove_nonexistent():
    item = Item.create(name="jeu")
    response = client.delete(f"/items/{item.id}/picture/5", headers=AUTH_ADMIN)
    assert response.status_code == 404


def test_picture_get_item():
    item = Item.create(name="jeu")
    ItemPicture.create(item=item, index=0, filename="0.jpg")
    ItemPicture.create(item=item, index=1, filename="1.jpg")

    response = client.get(f"/items/{item.id}")
    item = response.json()
    assert item["pictures"] == ["0.jpg", "1.jpg"]
