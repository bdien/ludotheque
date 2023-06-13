import peewee
from api.pwmodels import Loan, Item
from fastapi import APIRouter, HTTPException, Request, UploadFile
from playhouse.shortcuts import model_to_dict
import mimetypes
import os
import shutil


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

    # Retrieve item + status
    items = (
        Item.select(Item, Loan)
        .join(Loan, peewee.JOIN.LEFT_OUTER)
        .where(Item.id == item_id)
        .order_by(-Loan.stop)
        .limit(history)
        .execute()
    )

    if items:
        item = items[0]
        base = model_to_dict(item, recurse=False)
        loans = [i.loan for i in items] if hasattr(item, "loan") else []
        base["status"] = "in"
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
async def modify_item_picture(item_id: int, file: UploadFile):
    # Save new image to disk
    extension = mimetypes.guess_extension(file.content_type, strict=False)
    filename = f"jeu_{item_id:05d}{extension}"
    with open(f"{LUDO_STORAGE}/img/{filename}", "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    # Delete previous image and set new one in DB
    item = Item.get_by_id(item_id)
    if item.picture and item.picture != filename:
        print(f"Unlink {LUDO_STORAGE}/img/{item.picture}")
        os.unlink(f"{LUDO_STORAGE}/img/{item.picture}")
    item.picture = filename
    item.save()


@router.delete("/items/{item_id}", tags=["users"])
async def delete_item(item_id: int):
    if FAKE_USER_ROLE in ("operator", "admin"):
        HTTPException(403)

    item = Item.get_or_none(Item.id == item_id)
    if not item:
        raise HTTPException(404)
    item.delete_instance(recursive=True)
    if item.picture:
        os.unlink(f"{LUDO_STORAGE}/img/{item.picture}")
    item.save()
    return "OK"


@router.delete("/items/{item_id}/picture", tags=["items"])
def delete_item_picture(item_id: int):
    item = Item.get_by_id(item_id)
    if item.picture:
        os.unlink(f"{LUDO_STORAGE}/img/{item.picture}")
    item.picture = None
    item.save()


@router.get("/items/qsearch/{txt}", tags=["items"])
def qsearch_item(txt: str):
    return list(
        Item.select(Item.id, Item.name)
        .where((Item.name ** f"%{txt}%") | (Item.id ** f"%{txt}%"))
        .order_by(Item.id)
        .limit(10)
        .dicts()
    )
