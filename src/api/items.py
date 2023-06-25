import peewee
from api.pwmodels import Loan, Item, ItemPicture
from fastapi import APIRouter, HTTPException, Request, UploadFile
from playhouse.shortcuts import model_to_dict
import os
import hashlib
from PIL import Image


IMAGE_MAX_DIM = 800
FAKE_USER = 1
FAKE_USER_ROLE = "operator"  # Could be user, operator, admin
LUDO_STORAGE = os.getenv("LUDO_STORAGE", "../../storage").removesuffix("/")

router = APIRouter()


@router.post("/items", tags=["items"])
async def create_item(request: Request):
    body = await request.json()

    # Limit to selected properties
    create_params = {
        k: v
        for k, v in body.items()
        if k
        in (
            "name",
            "description",
            "age",
            "players_min",
            "players_max",
            "big",
            "outside",
        )
    }

    item = Item.create(**create_params)
    return model_to_dict(item)


@router.get("/items", tags=["items"])
def get_items(nb: int = 0, sort: str | None = None, q: str | None = None):
    query = Item.select()
    if nb:
        query = query.limit(nb)
    if q:
        query = query.where((Item.name ** f"%{q}%") | (Item.id ** f"%{q}%"))

    return list(query.order_by(Item.id).dicts())


@router.get("/items/{item_id}", tags=["items"])
def get_item(item_id: int, history: int | None = 10):
    if FAKE_USER_ROLE == "user":
        history = 1

    # Retrieve item + pictrres + status
    items = (
        Item.select(Item, Loan, ItemPicture)
        .join(ItemPicture, peewee.JOIN.LEFT_OUTER)
        .switch(Item)
        .join(Loan, peewee.JOIN.LEFT_OUTER)
        .where(Item.id == item_id)
        .order_by(ItemPicture.index, -Loan.stop)
        .limit(history)
        .execute()
    )

    if items:
        item = items[0]
        base = model_to_dict(item, recurse=False)
        loans = [i.loan for i in items] if hasattr(item, "loan") else []
        base["status"] = "in"

        pics = [i.itempicture for i in items] if hasattr(item, "itempicture") else []
        base["pictures"] = [p.filename for p in pics]

        if loans:
            base["status"] = loans[0].status
            base["return"] = loans[0].stop
            if FAKE_USER_ROLE in ("operator", "admin"):
                base["loans"] = [model_to_dict(i, recurse=False) for i in loans]
        return base
    raise HTTPException(404)


@router.post("/items/{item_id}", tags=["items"])
async def modify_item(item_id: int, request: Request):
    body = await request.json()

    # Limit to selected properties
    update_params = {
        k: v
        for k, v in body.items()
        if k
        in (
            "name",
            "description",
            "age",
            "players_min",
            "players_max",
            "big",
            "outside",
        )
    }

    Item.update(**update_params).where(Item.id == item_id).execute()


@router.post("/items/{item_id}/picture", tags=["items"])
async def create_item_picture(item_id: int, file: UploadFile):
    "Add new picture"

    # Convert (and maybe resize) new image to webP
    img = Image.open(file.file)
    if (img.width > IMAGE_MAX_DIM) or (img.height > IMAGE_MAX_DIM):
        img.thumbnail((IMAGE_MAX_DIM, IMAGE_MAX_DIM))

    # Name as a hash
    filename = f"jeu_{hashlib.md5(img.tobytes()).hexdigest()}.webp"  # noqa: S324
    print(f"Saving as {LUDO_STORAGE}/img/{filename}")
    img.save(f"{LUDO_STORAGE}/img/{filename}")

    # Find first non allocated indexes
    query = ItemPicture.select(ItemPicture.index).where(ItemPicture.item == item_id)
    indexes = [i["index"] for i in query.dicts()]
    newindex = next(idx for idx in range(30) if idx not in indexes)

    ItemPicture.create(item=item_id, index=newindex, filename=filename)


@router.post("/items/{item_id}/picture/{picture_index}", tags=["items"])
async def modify_item_picture(item_id: int, picture_index: int, file: UploadFile):
    # Convert (and maybe resize) new image to webP
    img = Image.open(file.file)
    if (img.width > IMAGE_MAX_DIM) or (img.height > IMAGE_MAX_DIM):
        img.thumbnail((IMAGE_MAX_DIM, IMAGE_MAX_DIM))

    filename = f"jeu_{hashlib.md5(img.tobytes()).hexdigest()}.webp"  # noqa: S324
    print(f"Saving as {LUDO_STORAGE}/img/{filename}")
    img.save(f"{LUDO_STORAGE}/img/{filename}")

    # Delete previous image
    picture = ItemPicture.get_or_none(item=item_id, index=picture_index)
    if not picture:
        ItemPicture.create(item=item_id, index=picture_index, filename=filename)
    else:
        if picture.filename != filename:
            print(f"Unlink {LUDO_STORAGE}/img/{picture.filename}")
            os.unlink(f"{LUDO_STORAGE}/img/{picture.filename}")

            # Set new one in DB
            picture.filename = filename
            picture.save()


@router.delete("/items/{item_id}/picture/{picture_index}", tags=["items"])
def delete_item_picture(item_id: int, picture_index: int):
    picture = ItemPicture.get_or_none(item=item_id, index=picture_index)
    if not picture:
        raise HTTPException(404)

    os.unlink(f"{LUDO_STORAGE}/img/{picture.filename}")
    picture.delete()


@router.delete("/items/{item_id}", tags=["users"])
async def delete_item(item_id: int):
    if FAKE_USER_ROLE in ("operator", "admin"):
        HTTPException(403)

    item = Item.get_or_none(Item.id == item_id)
    if not item:
        raise HTTPException(404)
    item.delete_instance(recursive=True)

    # Now remove every picture
    for p in ItemPicture.select().where(ItemPicture.item == item_id):
        os.unlink(f"{LUDO_STORAGE}/img/{p.filename}")

    return "OK"


@router.get("/items/qsearch/{txt}", tags=["items"])
def qsearch_item(txt: str):
    return list(
        Item.select(Item.id, Item.name)
        .where((Item.name ** f"%{txt}%") | (Item.id ** f"%{txt}%"))
        .order_by(Item.id)
        .limit(10)
        .dicts()
    )
