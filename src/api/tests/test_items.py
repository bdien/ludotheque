import datetime

import pytest
from conftest import AUTH_ADMIN, AUTH_USER, fake_auth_user, headers_auth
from fastapi.testclient import TestClient

from api.main import app
from api.pwmodels import (
    Category,
    Item,
    ItemCategory,
    ItemExtension,
    ItemLink,
    Loan,
    User,
    db,
)
from api.system import auth_user

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
    assert response.status_code >= 400

    response = client.delete("/items/0", headers=AUTH_USER)
    assert response.status_code >= 400


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


@pytest.mark.parametrize("auth_role", (AUTH_ADMIN, AUTH_USER, None))
def test_get_items(auth_role):
    # Create items
    item1 = {"name": "obj1", "age": 10, "players_min": 2, "players_max": 7}
    item2 = {"name": "obj2", "age": 5}
    response = client.post("/items", json=item1, headers=AUTH_ADMIN)
    response = client.post("/items", json=item2, headers=AUTH_ADMIN)

    # Check in API
    response = client.get("/items", headers=auth_role)
    items = response.json()
    assert len(items) == 2
    assert item1.items() <= items[0].items()
    assert item2.items() <= items[1].items()

    # Limit get items to 1 item
    response = client.get("/items?nb=1", headers=auth_role)
    items = response.json()
    assert len(items) == 1
    assert item1.items() <= items[0].items()


@pytest.mark.parametrize("auth_role", (AUTH_ADMIN, AUTH_USER, None))
def test_get_item(auth_role):
    # Create item
    with db:
        item = Item.create(id=66, name="obj1")
        Loan.create(item=item, user=User.create(name="user"))

    # Check in API
    response = client.get(f"/items/{item.id}", headers=auth_role)
    assert response.status_code == 200
    apiitem = response.json()
    assert apiitem["id"] == item.id
    assert apiitem["name"] == "obj1"


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


def test_get_loans():
    with db:
        user1 = User.create(name="un")
        user2 = User.create(name="deux")
        item = Item.create(name="item")
        loan1 = Loan.create(item=item, user=user1)
        loan1b = Loan.create(item=item, user=user1)
        loan2 = Loan.create(item=item, user=user2)

    # Not authenticated, no loans
    response = client.get(f"/items/{item.id}")
    api = response.json()
    assert "loans" not in api

    # Admin, all loans
    response = client.get(f"/items/{item.id}", headers=AUTH_ADMIN)
    api = response.json()
    ids = [i["id"] for i in api["loans"]]
    assert ids == [loan1.id, loan1b.id, loan2.id]

    # User 1 should only see his own loans
    response = client.get(f"/items/{item.id}", headers=headers_auth(user1))
    api = response.json()
    ids = [i["id"] for i in api["loans"]]
    assert ids == [loan1.id, loan1b.id]

    # User 2 should only see his own loan
    response = client.get(f"/items/{item.id}", headers=headers_auth(user2))
    api = response.json()
    ids = [i["id"] for i in api["loans"]]
    assert ids == [loan2.id]


def test_get_item_ratings():
    # Create items
    item1 = {"name": "obj1", "age": 10, "players_min": 2, "players_max": 7}
    item1["links"] = [
        {
            "name": "myludo",
            "ref": 1234,
            "extra": {"rating": 7.8},
        },
        {"name": "bgg", "ref": 5678, "extra": {"rating": 6.3, "complexity": 2.1}},
    ]
    response = client.post("/items", json=item1, headers=AUTH_ADMIN)
    item_id = response.json()["id"]

    # Check in API
    response = client.get(f"/items/{item_id}")
    items = response.json()
    assert "links" in items
    assert items["links"] == [
        {"name": "myludo", "ref": "1234", "extra": {"rating": 7.8}},
        {"name": "bgg", "ref": "5678", "extra": {"rating": 6.3, "complexity": 2.1}},
    ]


def test_extension_bases_crud():
    "Link an extension to base games, read both sides, then unlink"
    with db:
        base1 = Item.create(name="base1")
        base2 = Item.create(name="base2")
        ext = Item.create(name="ext")

    # Link to two bases
    response = client.post(
        f"/items/{ext.id}", json={"bases": [base1.id, base2.id]}, headers=AUTH_ADMIN
    )
    assert response.status_code == 200

    # Extension side
    response = client.get(f"/items/{ext.id}")
    assert response.status_code == 200
    api = response.json()
    assert api["is_extension"] is True
    assert sorted(b["id"] for b in api["bases"]) == sorted([base1.id, base2.id])

    # Base side
    response = client.get(f"/items/{base1.id}")
    assert response.status_code == 200
    api = response.json()
    assert api["is_extension"] is False
    assert [e["id"] for e in api["extensions"]] == [ext.id]
    assert api["bases"] == []

    # Unlink one base
    response = client.post(
        f"/items/{ext.id}", json={"bases": [base2.id]}, headers=AUTH_ADMIN
    )
    assert response.status_code == 200
    response = client.get(f"/items/{ext.id}")
    assert [b["id"] for b in response.json()["bases"]] == [base2.id]
    response = client.get(f"/items/{base1.id}")
    assert response.json()["extensions"] == []

    # Unlink all -> no longer an extension
    response = client.post(f"/items/{ext.id}", json={"bases": []}, headers=AUTH_ADMIN)
    assert response.status_code == 200
    response = client.get(f"/items/{ext.id}")
    assert response.json()["bases"] == []
    assert response.json()["is_extension"] is False


def test_extension_bases_on_create():
    "Create an item directly with bases"
    with db:
        base = Item.create(name="base")
    response = client.post(
        "/items", json={"name": "ext", "bases": [base.id]}, headers=AUTH_ADMIN
    )
    assert response.status_code == 200
    response = client.get(f"/items/{response.json()['id']}")
    assert response.json()["is_extension"] is True
    assert [b["id"] for b in response.json()["bases"]] == [base.id]


def test_extension_self_link_refused():
    with db:
        item = Item.create(name="obj")
    response = client.post(
        f"/items/{item.id}", json={"bases": [item.id]}, headers=AUTH_ADMIN
    )
    assert response.status_code == 400


def test_extension_unknown_base_refused():
    with db:
        item = Item.create(name="obj")
    response = client.post(
        f"/items/{item.id}", json={"bases": [999999]}, headers=AUTH_ADMIN
    )
    assert response.status_code == 400


def test_extension_edit_forbidden():
    with db:
        item = Item.create(name="obj")
        base = Item.create(name="base")
    response = client.post(
        f"/items/{item.id}", json={"bases": [base.id]}, headers=AUTH_USER
    )
    assert response.status_code == 403


def test_extension_disabled_bases_hidden():
    "Disabled linked games are hidden, as if the link did not exist"
    with db:
        base = Item.create(name="base", enabled=False)
        ext = Item.create(name="ext")
        ItemExtension.create(extension=ext, base=base)

    # The disabled base is hidden from the extension fiche...
    response = client.get(f"/items/{ext.id}")
    assert response.json()["bases"] == []
    assert response.json()["is_extension"] is False
    # ...but the enabled extension still shows on the base fiche
    response = client.get(f"/items/{base.id}")
    assert [e["id"] for e in response.json()["extensions"]] == [ext.id]


def test_extension_list_and_search_flags():
    with db:
        base = Item.create(name="basegame")
        ext = Item.create(name="extgame")
        ItemExtension.create(extension=ext, base=base)

    response = client.get("/items")
    assert response.status_code == 200
    flags = {i["name"]: i["is_extension"] for i in response.json()}
    assert flags == {"basegame": False, "extgame": True}

    response = client.get("/items/search?q=game")
    assert response.status_code == 200
    flags = {i["name"]: i["is_extension"] for i in response.json()}
    assert flags == {"basegame": False, "extgame": True}


def test_search_include_loaned():
    "Loaned games are hidden by default but visible with include_loaned"
    with db:
        user = User.create(name="user")
        item = Item.create(name="loanable")
        Loan.create(user=user, item=item, status="out")

    response = client.get("/items/search?q=loanable")
    assert response.status_code == 200
    assert response.json() == []

    response = client.get("/items/search?q=loanable&include_loaned=true")
    assert response.status_code == 200
    assert [i["name"] for i in response.json()] == ["loanable"]


def test_delete_item_cleans_extension_links():
    with db:
        base = Item.create(name="base")
        ext = Item.create(name="ext")
        ItemExtension.create(extension=ext, base=base)

    # Delete the extension -> link gone
    response = client.delete(f"/items/{ext.id}", headers=AUTH_ADMIN)
    assert response.status_code == 200
    with db:
        assert ItemExtension.select().count() == 0

    # Re-link then delete the base -> link gone too
    with db:
        ext2 = Item.create(name="ext2")
        ItemExtension.create(extension=ext2, base=base)
    response = client.delete(f"/items/{base.id}", headers=AUTH_ADMIN)
    assert response.status_code == 200
    with db:
        assert ItemExtension.select().count() == 0
