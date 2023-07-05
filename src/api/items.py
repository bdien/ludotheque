import contextlib
from api.pwmodels import Category, ItemCategory, ItemLink, Loan, Item, ItemPicture, User
from api.system import auth_user
from fastapi import APIRouter, HTTPException, Request, UploadFile, Depends
from playhouse.shortcuts import model_to_dict
import os
import hashlib
from PIL import Image


IMAGE_MAX_DIM = 800
LUDO_STORAGE = os.getenv("LUDO_STORAGE", "../../storage").removesuffix("/")

router = APIRouter()


@router.post("/items", tags=["items"])
async def create_item(request: Request, auth=Depends(auth_user)):
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    body = await request.json()

    # Avoid some properties
    params = {k: v for k, v in body.items() if k in Item._meta.fields}
    params = {k: v for k, v in params.items() if k not in ("id", "created_at")}

    # Checks
    if not (0 <= int(params.get("gametime") or 1) <= 360):
        raise HTTPException(400, "Invalid gametime")

    item = Item.create(**params)

    # Modify item links
    for i in body.get("links", []):
        ItemLink.insert(
            item=item, name=i["name"], ref=i["ref"]
        ).on_conflict_replace().execute()

    # Modify item category
    for i in body.get("categories", []):
        ItemCategory.insert(item=item, category=i).on_conflict_ignore().execute()

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
def get_item(item_id: int, history: int | None = 10, auth=Depends(auth_user)):
    if not auth or auth.role != "admin":
        history = 1  # noqa: F841

    # Retrieve item + pictures + status (Limit to the last 10 loans)
    # sourcery skip: use-named-expression
    items = (
        Item.select(Item, Loan, ItemLink, ItemCategory, ItemPicture, User.name, User.id)
        .left_outer_join(ItemLink)
        .switch(Item)
        .left_outer_join(ItemCategory)
        .switch(Item)
        .left_outer_join(ItemPicture)
        .switch(Item)
        .left_outer_join(Loan)
        .limit(10)
        .left_outer_join(User)
        .where(Item.id == item_id)
        .order_by(ItemPicture.index, -Loan.stop)
        .execute()
    )

    if items:
        # First item is the latest loan
        item = items[0]
        base = model_to_dict(item, recurse=False)
        loans = [i.loan for i in items] if hasattr(item, "loan") else []
        base["status"] = "in"

        pics = [i.itempicture for i in items] if hasattr(item, "itempicture") else []
        base["pictures"] = [p.filename for p in pics]

        base["categories"] = {
            i.itemcategory.category_id for i in items if hasattr(i, "itemcategory")
        }
        base["links"] = [
            {"name": i.itemlink.name, "ref": i.itemlink.ref}
            for i in items
            if hasattr(i, "itemlink")
        ]

        if loans:
            base["status"] = loans[0].status
            base["return"] = loans[0].stop
            if auth and auth.role == "admin":
                # Return all loans + user
                base["loans"] = [
                    model_to_dict(i, recurse=False)
                    | {
                        "user": model_to_dict(
                            i.user, recurse=False, only=[User.id, User.name]
                        )
                    }
                    for i in loans
                ]
        return base
    raise HTTPException(404)


@router.post("/items/{item_id}", tags=["items"])
async def modify_item(item_id: int, request: Request, auth=Depends(auth_user)):
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    body = await request.json()

    # Avoid some properties
    params = {k: v for k, v in body.items() if k in Item._meta.fields}
    params = {k: v for k, v in params.items() if k not in ("id", "created_at")}

    # Checks
    if not (0 <= int(params.get("gametime") or 1) <= 360):
        raise HTTPException(400, "Invalid gametime")

    # Modify main object
    if params:
        Item.update(**params).where(Item.id == item_id).execute()

    # Modify item links
    for i in body.get("links", []):
        ItemLink.insert(
            item=item_id, name=i["name"], ref=i["ref"]
        ).on_conflict_replace().execute()

    # Modify item category
    for i in body.get("categories", []):
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

    picture = ItemPicture.get_or_none(item=item_id, index=picture_index)
    if not picture:
        raise HTTPException(404)

    with contextlib.suppress(FileNotFoundError):
        os.unlink(f"{LUDO_STORAGE}/img/{picture.filename}")
    picture.delete()


@router.delete("/items/{item_id}", tags=["users"])
async def delete_item(item_id: int, auth=Depends(auth_user)):
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    item = Item.get_or_none(Item.id == item_id)
    if not item:
        raise HTTPException(404)
    item.delete_instance(recursive=True)

    # Now remove every picture
    for p in ItemPicture.select().where(ItemPicture.item == item_id):
        with contextlib.suppress(FileNotFoundError):
            os.unlink(f"{LUDO_STORAGE}/img/{p.filename}")

    return "OK"


@router.get("/items/qsearch/{txt}", tags=["items"])
def qsearch_item(txt: str):
    "Return a list of max 10 items matching filter (and not already loaned)"

    loaned_items = Loan.select(Loan.item).where(Loan.status == "out")
    return list(
        Item.select(Item.id, Item.name, Item.big)
        .where((Item.name ** f"%{txt}%") | (Item.id ** f"%{txt}%"))
        .where(Item.id.not_in(loaned_items))
        .order_by(Item.id)
        .limit(10)
        .dicts()
    )


@router.get("/categories", tags=["categories"])
def get_categories():
    "Return all categories"
    return list(Category.select().dicts())


@router.post("/categories", tags=["categories"])
async def create_category(request: Request, auth=Depends(auth_user)):
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    body = await request.json()
    c = Category.create(name=body["name"])
    return model_to_dict(c)


@router.post("/categories/{cat_id}", tags=["categories"])
async def update_category(cat_id: int, request: Request, auth=Depends(auth_user)):
    if not auth or auth.role != "admin":
        raise HTTPException(403)

    body = await request.json()
    Category.update(name=body["name"]).where(Category.id == cat_id).execute()
