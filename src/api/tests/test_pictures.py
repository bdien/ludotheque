import base64
import os

from conftest import AUTH_ADMIN, fake_auth_user
from fastapi.testclient import TestClient

from api.main import app
from api.pwmodels import Item, db
from api.system import auth_user

client = TestClient(app)
app.dependency_overrides[auth_user] = fake_auth_user

IMG_FILE = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x03\x02\x02\x02\x02\x02\x03\x02\x02\x02\x03\x03\x03\x03\x04\x06\x04\x04\x04\x04\x04\x08\x06\x06\x05\x06\t\x08\n\n\t\x08\t\t\n\x0c\x0f\x0c\n\x0b\x0e\x0b\t\t\r\x11\r\x0e\x0f\x10\x10\x11\x10\n\x0c\x12\x13\x12\x10\x13\x0f\x10\x10\x10\xff\xc9\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xcc\x00\x06\x00\x10\x10\x05\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xd2\xcf \xff\xd9"


def test_create_item_with_pictures(fakestorage):
    img64 = "data:image/jpeg;base64," + base64.b64encode(IMG_FILE).decode()
    response = client.post(
        "/items", json={"name": "objet", "pictures": [img64]}, headers=AUTH_ADMIN
    )
    assert response.status_code == 200
    newitem = response.json()
    assert "id" in newitem

    assert os.path.isfile(
        f"{fakestorage}/img/jeu_00001_b2bb8775b7d5bf59c36c8637293a4602.webp"
    )
    assert os.path.isfile(
        f"{fakestorage}/thumb/jeu_00001_b2bb8775b7d5bf59c36c8637293a4602.webp"
    )

    # Check in DB
    with db:
        item_db = Item.get_by_id(newitem["id"])
        assert item_db.name == "objet"
        assert item_db.pictures == ["jeu_00001_b2bb8775b7d5bf59c36c8637293a4602.webp"]

    # Check in API
    response = client.get(f"/items/{newitem['id']}")
    assert response.status_code == 200
    item = response.json()
    assert item["name"] == "objet"
    assert item["pictures"] == ["jeu_00001_b2bb8775b7d5bf59c36c8637293a4602.webp"]


def test_item_add_picture(fakestorage):
    "Add two pictures"
    with db:
        item = Item.create(id=1, name="jeu", pictures=["jeu_1.jpg"])
    img64 = "data:image/jpeg;base64," + base64.b64encode(IMG_FILE).decode()

    # Add a new picture
    response = client.post(
        f"/items/{item.id}",
        json={"pictures": ["jeu_1.jpg", img64]},
        headers=AUTH_ADMIN,
    )
    assert response.status_code == 200

    assert os.path.isfile(
        f"{fakestorage}/img/jeu_00001_b2bb8775b7d5bf59c36c8637293a4602.webp"
    )
    assert os.path.isfile(
        f"{fakestorage}/thumb/jeu_00001_b2bb8775b7d5bf59c36c8637293a4602.webp"
    )
    with db:
        assert Item.get(item).pictures == [
            "jeu_1.jpg",
            "jeu_00001_b2bb8775b7d5bf59c36c8637293a4602.webp",
        ]


def test_item_add_picture_twice(fakestorage):
    with db:
        item = Item.create(id=1, name="jeu", pictures=["jeu_1.jpg"])
    img64 = "data:image/jpeg;base64," + base64.b64encode(IMG_FILE).decode()

    # Add a new picture
    response = client.post(
        f"/items/{item.id}",
        json={"pictures": ["jeu_1.jpg", img64, img64, "jeu_1.jpg"]},
        headers=AUTH_ADMIN,
    )
    assert response.status_code == 200

    assert os.path.isfile(
        f"{fakestorage}/img/jeu_00001_b2bb8775b7d5bf59c36c8637293a4602.webp"
    )
    assert os.path.isfile(
        f"{fakestorage}/thumb/jeu_00001_b2bb8775b7d5bf59c36c8637293a4602.webp"
    )
    with db:
        assert Item.get(item).pictures == [
            "jeu_1.jpg",
            "jeu_00001_b2bb8775b7d5bf59c36c8637293a4602.webp",
        ]


def test_item_modify_picture(fakestorage):
    with db:
        item = Item.create(id=1, name="jeu", pictures=["jeu_1.jpg"])
    with open(f"{fakestorage}/img/jeu_1.jpg", "w") as f:
        f.write("0")

    img64 = "data:image/jpeg;base64," + base64.b64encode(IMG_FILE).decode()
    response = client.post(
        f"/items/{item.id}",
        json={"pictures": [img64]},
        headers=AUTH_ADMIN,
    )
    assert response.status_code == 200

    assert os.path.isfile(
        f"{fakestorage}/img/jeu_00001_b2bb8775b7d5bf59c36c8637293a4602.webp"
    )
    assert os.path.isfile(
        f"{fakestorage}/thumb/jeu_00001_b2bb8775b7d5bf59c36c8637293a4602.webp"
    )
    assert not os.path.isfile(f"{fakestorage}/img/jeu_1.jpg")
    with db:
        assert Item.get(item).pictures == [
            "jeu_00001_b2bb8775b7d5bf59c36c8637293a4602.webp"
        ]


def test_picture_remove_existent(fakestorage):
    with db:
        item = Item.create(id=1, name="jeu", pictures=["jeu_1.jpg"])
    with open(f"{fakestorage}/img/jeu_1.jpg", "w") as f:
        f.write("0")

    response = client.post(
        f"/items/{item.id}",
        json={"pictures": []},
        headers=AUTH_ADMIN,
    )
    assert response.status_code == 200
    assert not os.path.isfile(f"{fakestorage}/img/jeu_1.jpg")
    with db:
        assert Item.get(item).pictures == []
