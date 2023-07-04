from api.main import app
from api.system import auth_user
from api.pwmodels import Category
from fastapi.testclient import TestClient
from conftest import AUTH_ADMIN, fake_auth_user

client = TestClient(app)
app.dependency_overrides[auth_user] = fake_auth_user


def test_create_category():
    response = client.post("/categories", json={"name": "cat1"}, headers=AUTH_ADMIN)
    assert response.status_code == 200
    newcat = response.json()
    assert "id" in newcat

    # Check in DB
    cat_db = Category.get_by_id(newcat["id"])
    assert cat_db.name == "cat1"


def test_create_item_with_category():
    # Create a category
    Category.create(id=66, name="cat1")

    # Create a new item with category
    response = client.post(
        "/items", json={"name": "obj1", "categories": [66]}, headers=AUTH_ADMIN
    )
    assert response.status_code == 200
    obj_id = response.json()["id"]

    # Query the new item
    response = client.get(f"/items/{obj_id}")
    obj = response.json()
    assert obj["categories"] == [66]
