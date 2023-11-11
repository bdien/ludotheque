import contextlib
import csv
import io
from fastapi.responses import PlainTextResponse
import peewee
from api.pwmodels import (
    Category,
    ItemCategory,
    ItemLink,
    Loan,
    Item,
    ItemPicture,
    db,
)
from api.system import auth_user
from api.config import IMAGE_MAX_DIM
from fastapi import APIRouter, HTTPException, Request, UploadFile, Depends
from playhouse.shortcuts import model_to_dict
import os
import hashlib
from PIL import Image


LUDO_STORAGE = os.getenv("LUDO_STORAGE", "../../storage").removesuffix("/")

router = APIRouter()


@router.post("/items", tags=["items"])
async def create_item(request: Request, auth=Depends(auth_user)):
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    body = await request.json()

    # Avoid some properties
    params = {k: v for k, v in body.items() if k in Item._meta.fields}
    params = {k: v for k, v in params.items() if k not in ("created_at",)}
    # Remove ID = None or ""
    if ("id" in params) and not params["id"]:
        del params["id"]

    # Checks
    if not (0 <= int(params.get("gametime") or 1) <= 360):
        raise HTTPException(400, "Invalid gametime")

    with db:
        try:
            item = Item.create(**params)

            # Insert item links
            for i in body.get("links", []):
                ItemLink.insert(
                    item=item, name=i["name"], ref=i["ref"]
                ).on_conflict_replace().execute()

            # Insert item category
            for i in body.get("categories", []):
                ItemCategory.insert(
                    item=item, category=i
                ).on_conflict_ignore().execute()

            return model_to_dict(item)
        except peewee.IntegrityError as e:
            if e.args[0] == "UNIQUE constraint failed: item.id":
                raise HTTPException(
                    500, f"Le numéro '{params['id']}' est déjà utilisé"
                ) from None
            raise HTTPException(500, str(e)) from None


@router.get("/items", tags=["items"])
def get_items(nb: int = 0, sort: str | None = None, q: str | None = None):
    # Subquery, all item loaned
    subquery = Loan.select(Loan.item_id, Loan.status).where(Loan.status == "out")

    query = Item.select(
        Item.id,
        Item.name,
        Item.enabled,
        Item.players_min,
        Item.players_max,
        Item.age,
        Item.big,
        Item.outside,
        subquery.c.status,
    )
    if nb:
        query = query.limit(nb)
    if q:
        query = query.where((Item.name ** f"%{q}%") | (Item.id ** f"%{q}%"))

    # Left join with the subquery
    query = query.join(
        subquery, peewee.JOIN.LEFT_OUTER, on=subquery.c.item_id == Item.id
    )

    with db:
        return list(query.order_by(Item.id).dicts())


@router.get("/items/export", tags=["items"], response_class=PlainTextResponse)
def export_items(auth=Depends(auth_user)):
    "Export CSV"
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    f = io.StringIO()
    csvwriter = csv.DictWriter(
        f,
        ["id", "name", "enabled", "big", "outside", "created_at", "status"],
        extrasaction="ignore",
        delimiter=";",
    )
    csvwriter.writeheader()

    # Subquery, all item loaned
    subquery = Loan.select(Loan.item_id, Loan.status).where(Loan.status == "out")
    # Left join with the subquery
    query = Item.select(Item, subquery.c.status).join(
        subquery, peewee.JOIN.LEFT_OUTER, on=subquery.c.item_id == Item.id
    )

    with db:
        for u in query.dicts():
            csvwriter.writerow(u)
        return f.getvalue()


@router.get("/items/search", tags=["items"])
def search_item(q: str | None = None):
    "Return a list of max 10 items matching filter (and not already loaned)"

    with db:
        loaned_items = Loan.select(Loan.item).where(Loan.status == "out")
        return list(
            Item.select(Item.id, Item.name, Item.big)
            .where((Item.name ** f"%{q}%") | (Item.id ** f"%{q}%"))
            .where(Item.id.not_in(loaned_items))
            .where(Item.enabled)
            .order_by(Item.id)
            .limit(10)
            .dicts()
        )


@router.get("/items/{item_id}", tags=["items"])
def get_item(
    item_id: int,
    history: int | None = 10,
    auth=Depends(auth_user),
):
    if not auth or auth.role not in ("admin", "benevole"):
        history = 1  # noqa: F841

    # Retrieve item + pictures + status (Limit to the last 10 loans)
    # sourcery skip: use-named-expression
    with db:
        items = (
            Item.select(Item, Loan)
            .left_outer_join(Loan)
            .limit(10)
            .where(Item.id == item_id)
            .order_by(-Loan.stop)
        )

        if items:
            # First item is the latest loan
            item = items[0]
            base = model_to_dict(item, recurse=False)
            loans = [i.loan for i in items] if hasattr(item, "loan") else []
            base["status"] = "in"

            base["pictures"] = [
                p.filename
                for p in ItemPicture.select()
                .where(ItemPicture.item == item_id)
                .order_by(ItemPicture.index)
            ]
            base["categories"] = [
                i.category_id
                for i in ItemCategory.select().where(ItemCategory.item == item_id)
            ]

            base["links"] = [
                {"name": i.name, "ref": i.ref}
                for i in ItemLink.select().where(ItemLink.item == item_id)
            ]

            if loans:
                base["status"] = loans[0].status
                base["return"] = loans[0].stop
                if auth and auth.role in ("admin", "benevole"):
                    # Return all loans
                    base["loans"] = [model_to_dict(i, recurse=False) for i in loans]
            return base
    raise HTTPException(404)


@router.post("/items/{item_id}", tags=["items"])
async def modify_item(item_id: int, request: Request, auth=Depends(auth_user)):
    if not auth or auth.role not in ("admin", "benevole"):
        raise HTTPException(403)

    body = await request.json()

    # Avoid some properties
    params = {k: v for k, v in body.items() if k in Item._meta.fields}
    params = {k: v for k, v in params.items() if k not in ("id", "created_at")}

    # Checks
    if not (0 <= int(params.get("gametime") or 1) <= 360):
        raise HTTPException(400, "Invalid gametime")

    # Modify main object
    with db:
        if params:
            Item.update(**params).where(Item.id == item_id).execute()

        # Modify item links
        for i in body.get("links", []):
            names = [i["name"] for i in body["links"]]
            ItemLink.delete().where(
                ItemLink.item == item_id, ItemLink.name.not_in(names)
            ).execute()
            ItemLink.insert(
                item=item_id, name=i["name"], ref=i["ref"]
            ).on_conflict_replace().execute()

        # Modify item categories
        for i in body.get("categories", []):
            ItemCategory.delete().where(
                ItemCategory.item == item_id,
                ItemCategory.category.not_in(body["categories"]),
            ).execute()
            ItemCategory.insert(item=item_id, category=i).on_conflict_ignore().execute()


@router.post("/items/{item_id}/picture", tags=["items"])
async def create_item_picture(item_id: int, file: UploadFile, auth=Depends(auth_user)):
    "Add new picture"

    if not auth or auth.role != "admin":
        raise HTTPException(403)

    # Convert (and maybe resize) new image to webP
    img = Image.open(file.file)
    if (img.width > IMAGE_MAX_DIM) or (img.height > IMAGE_MAX_DIM):
        img.thumbnail((IMAGE_MAX_DIM, IMAGE_MAX_DIM))

    # Name as a hash
    filename = f"jeu_{hashlib.md5(img.tobytes()).hexdigest()}.webp"  # noqa: S324
    print(f"Saving as {LUDO_STORAGE}/img/{filename}")
    img.save(f"{LUDO_STORAGE}/img/{filename}")

    # Find first non allocated indexes
    with db:
        query = ItemPicture.select(ItemPicture.index).where(ItemPicture.item == item_id)
        indexes = [i["index"] for i in query.dicts()]
        newindex = next(idx for idx in range(30) if idx not in indexes)

        ItemPicture.create(item=item_id, index=newindex, filename=filename)


@router.post("/items/{item_id}/picture/{picture_index}", tags=["items"])
async def modify_item_picture(
    item_id: int, picture_index: int, file: UploadFile, auth=Depends(auth_user)
):
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    # Convert (and maybe resize) new image to webP
    img = Image.open(file.file)
    if (img.width > IMAGE_MAX_DIM) or (img.height > IMAGE_MAX_DIM):
        img.thumbnail((IMAGE_MAX_DIM, IMAGE_MAX_DIM))

    filename = f"jeu_{hashlib.md5(img.tobytes()).hexdigest()}.webp"  # noqa: S324
    print(f"Saving as {LUDO_STORAGE}/img/{filename}")
    img.save(f"{LUDO_STORAGE}/img/{filename}")

    # Delete previous image
    with db:
        picture = ItemPicture.get_or_none(item=item_id, index=picture_index)
        if not picture:
            ItemPicture.create(item=item_id, index=picture_index, filename=filename)
        else:
            if picture.filename != filename:
                print(f"Unlink {LUDO_STORAGE}/img/{picture.filename}")
                with contextlib.suppress(FileNotFoundError):
                    os.unlink(f"{LUDO_STORAGE}/img/{picture.filename}")

                # Set new one in DB
                picture.filename = filename
                picture.save()


@router.delete("/items/{item_id}/picture/{picture_index}", tags=["items"])
def delete_item_picture(item_id: int, picture_index: int, auth=Depends(auth_user)):
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    with db:
        picture = ItemPicture.get_or_none(item=item_id, index=picture_index)
        if not picture:
            raise HTTPException(404)

        with contextlib.suppress(FileNotFoundError):
            os.unlink(f"{LUDO_STORAGE}/img/{picture.filename}")
        picture.delete_instance()


@router.delete("/items/{item_id}", tags=["users"])
async def delete_item(item_id: int, auth=Depends(auth_user)):
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    with db:
        item = Item.get_or_none(Item.id == item_id)
        if not item:
            raise HTTPException(404)
        item.delete_instance(recursive=True)

        # Now remove every picture
        for p in ItemPicture.select().where(ItemPicture.item == item_id):
            with contextlib.suppress(FileNotFoundError):
                os.unlink(f"{LUDO_STORAGE}/img/{p.filename}")

        return "OK"


@router.get("/categories", tags=["categories"])
def get_categories():
    "Return all categories"
    with db:
        return list(Category.select().order_by(Category.name).dicts())


@router.post("/categories", tags=["categories"])
async def create_category(request: Request, auth=Depends(auth_user)):
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    body = await request.json()
    with db:
        c = Category.create(name=body["name"])
        return model_to_dict(c)


@router.post("/categories/{cat_id}", tags=["categories"])
async def update_category(cat_id: int, request: Request, auth=Depends(auth_user)):
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    body = await request.json()
    with db:
        Category.update(name=body["name"]).where(Category.id == cat_id).execute()
