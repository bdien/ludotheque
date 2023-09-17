import io
import os
from api.main import app
from api.system import auth_user
from api.pwmodels import Item, ItemPicture, db
from fastapi.testclient import TestClient
from conftest import AUTH_ADMIN, fake_auth_user

client = TestClient(app)
app.dependency_overrides[auth_user] = fake_auth_user

IMG_FILE = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x03\x02\x02\x02\x02\x02\x03\x02\x02\x02\x03\x03\x03\x03\x04\x06\x04\x04\x04\x04\x04\x08\x06\x06\x05\x06\t\x08\n\n\t\x08\t\t\n\x0c\x0f\x0c\n\x0b\x0e\x0b\t\t\r\x11\r\x0e\x0f\x10\x10\x11\x10\n\x0c\x12\x13\x12\x10\x13\x0f\x10\x10\x10\xff\xc9\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xcc\x00\x06\x00\x10\x10\x05\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xd2\xcf \xff\xd9"


def test_item_add_picture(fakestorage):
    "Add two pictures, it should avoid the index 1"
    with db:
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
    with db:
        ItemPicture.get(item=item, index=0)

    # Now create a second one
    response = client.post(
        f"/items/{item.id}/picture",
        files={"file": ("filename", f, "image/jpeg")},
        headers=AUTH_ADMIN,
    )
    assert response.status_code == 200
    with db:
        ItemPicture.get(item=item, index=2)


def test_item_modify_picture(fakestorage):
    with db:
        item = Item.create(name="jeu")

    with open(f"{fakestorage}/img/none.jpg", "w") as f:
        f.write("0")
    with db:
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
    with db:
        item = ItemPicture.get(item=item, index=0)
        assert item.filename == "jeu_b2bb8775b7d5bf59c36c8637293a4602.webp"


def test_item_modify_picture_nonexistent(fakestorage):
    with db:
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
    with db:
        item = ItemPicture.get(item=item, index=0)
        assert item.filename == "jeu_b2bb8775b7d5bf59c36c8637293a4602.webp"


def test_picture_remove_existent(fakestorage):
    with db:
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
    with db:
        assert not ItemPicture.get_or_none(item=item, index=0)


def test_picture_remove_nonexistent():
    with db:
        item = Item.create(name="jeu")
    response = client.delete(f"/items/{item.id}/picture/5", headers=AUTH_ADMIN)
    assert response.status_code == 404


def test_picture_get_item():
    with db:
        item = Item.create(name="jeu")
        ItemPicture.create(item=item, index=0, filename="0.jpg")
        ItemPicture.create(item=item, index=1, filename="1.jpg")

    response = client.get(f"/items/{item.id}")
    item = response.json()
    assert item["pictures"] == ["0.jpg", "1.jpg"]
