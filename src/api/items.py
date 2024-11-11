import base64
import contextlib
import csv
import io
from fastapi.responses import PlainTextResponse
import peewee
from api.pwmodels import (
    Booking,
    Category,
    ItemCategory,
    ItemLink,
    Loan,
    Item,
    Rating,
    db,
)
from api.system import auth_user, check_auth
from api.config import IMAGE_MAX_DIM, THUMB_DIM
from fastapi import APIRouter, HTTPException, Request, Depends
from playhouse.shortcuts import model_to_dict
import os
import hashlib
from PIL import Image


LUDO_STORAGE = os.getenv("LUDO_STORAGE", "../../storage").removesuffix("/")

router = APIRouter()


@router.post("/items", tags=["items", "admin"])
async def create_item(request: Request, auth=Depends(auth_user)):
    check_auth(auth, "admin")
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
            pictures = params.pop("pictures", [])
            item = Item.create(**params)

            # Add pictures
            if pictures:
                item.pictures = modif_pictures(item.id, item.pictures, pictures)
                item.save()

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
        Item.created_at,
        subquery.c.status,
    )
    if nb:
        query = query.limit(nb)
    if q:
        query = query.where((Item.name ** f"%{q}%") | (Item.id ** f"%{q}%"))

    if sort == "created_at":
        query = query.order_by(Item.created_at.desc())
    else:
        query = query.order_by(Item.id.asc())

    # Left join with the subquery
    query = query.join(
        subquery, peewee.JOIN.LEFT_OUTER, on=subquery.c.item_id == Item.id
    )

    with db:
        return list(query.dicts())


@router.get("/items/export", tags=["items", "admin"], response_class=PlainTextResponse)
def export_items(auth=Depends(auth_user)):
    "Export CSV"

    check_auth(auth, "admin")
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
    auth=Depends(auth_user),
):
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
            base["categories"] = [
                i.category_id
                for i in ItemCategory.select().where(ItemCategory.item == item_id)
            ]

            base["links"] = [
                {"name": i.name, "ref": i.ref}
                for i in ItemLink.select().where(ItemLink.item == item_id)
            ]

            # Remove notes for non-admin
            if not auth or auth.role != "admin":
                del base["notes"]

            # Bookings
            bookings = list(
                Booking.select()
                .where(Booking.item == item_id)
                .order_by(Booking.created_at)
                .dicts()
            )
            base["bookings"] = {"nb": len(bookings)}
            if auth:
                if auth.role == "admin":
                    base["bookings"]["entries"] = bookings
                else:
                    base["bookings"]["entries"] = [
                        i for i in bookings if i["user"] == auth.id
                    ]

            # Ratings
            ratings = list(
                Rating.select(Rating.weight, Rating.rating)
                .where(Rating.item == item_id)
                .tuples()
            )
            if ratings:
                base["rating"] = round(
                    sum(w * r for w, r in ratings) / sum(w for w, r in ratings), 1
                )

            if loans:
                base["status"] = loans[0].status
                base["return"] = loans[0].stop
                if auth:
                    if auth.role == "admin":
                        # Return all loans
                        base["loans"] = [model_to_dict(i, recurse=False) for i in loans]
                    elif (auth.role == "benevole") and (base["status"] == "out"):
                        # Return last loan if loaned
                        base["loans"] = [model_to_dict(loans[0], recurse=False)]

            return base
    raise HTTPException(404)


def modif_pictures(
    item_id: int, oldpictures: list[str], pictures: list[str]
) -> list[str]:
    """Receive pictures (might be data), create and remove files"""

    # Build all movements
    newpictures = []
    for p in pictures:
        # Already existing pictures
        if not p.startswith("data:"):
            if p in oldpictures:
                newpictures.append(p)
                oldpictures.remove(p)
            continue

        # New pictures (UUencoded bytes)
        imgdata = io.BytesIO(base64.b64decode(p.split(",", 1)[1]))

        # Convert (and maybe resize) new image to webP
        img = Image.open(imgdata)
        if (img.width > IMAGE_MAX_DIM) or (img.height > IMAGE_MAX_DIM):
            img.thumbnail((IMAGE_MAX_DIM, IMAGE_MAX_DIM))

        # Filename based on hash
        hash = hashlib.md5(img.tobytes()).hexdigest()  # noqa: S324
        filename = f"jeu_{item_id:05d}_{hash}.webp"
        if filename not in newpictures:
            img.save(f"{LUDO_STORAGE}/img/{filename}")
            img.thumbnail((THUMB_DIM, THUMB_DIM))
            img.save(f"{LUDO_STORAGE}/thumb/{filename}")
            newpictures.append(filename)

    # Remove all non-referenced pictures
    for p in oldpictures:
        print(f"Removing {p}")
        with contextlib.suppress(Exception):
            os.unlink(f"{LUDO_STORAGE}/img/{p}")
        with contextlib.suppress(Exception):
            os.unlink(f"{LUDO_STORAGE}/thumb/{p}")

    # Final structure for DB
    return newpictures


@router.post("/items/{item_id}", tags=["items", "benevole"])
async def modify_item(item_id: int, request: Request, auth=Depends(auth_user)):
    check_auth(auth, "benevole")
    body = await request.json()

    # Avoid some properties
    params = {k: v for k, v in body.items() if k in Item._meta.fields}
    params = {k: v for k, v in params.items() if k not in ("id", "created_at")}

    # Checks
    if not (0 <= int(params.get("gametime") or 1) <= 360):
        raise HTTPException(400, "Invalid gametime")

    # Modify main object
    with db:
        # Previous item
        item = Item.get(id=item_id)

        # Add/remove/update pictures
        if "pictures" in params and (item.pictures != params["pictures"]):
            params["pictures"] = modif_pictures(
                item_id, item.pictures, params["pictures"]
            )

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


@router.post("/items/{item_id}/rating", tags=["items"])
async def create_item_rating(item_id: int, request: Request, auth=Depends(auth_user)):
    "Add rating"

    check_auth(auth)
    body = await request.json()
    source = body.get("source", "website")
    weight = body.get("weight", 1)

    if (source != "website" or weight != 1) and auth.role != "admin":
        raise HTTPException(403)

    with db:
        if source == "myludo":
            Rating.delete().where(
                Rating.item == item_id, Rating.source == source
            ).execute()
            for rating, nb in body.get("ratings").items():
                Rating.insert(
                    item=item_id, source=source, weight=nb, rating=rating
                ).execute()
        else:
            rating = body["rating"]
            Rating.replace(
                item=item_id, user=auth.id, weight=weight, rating=rating
            ).execute()


@router.delete("/items/{item_id}", tags=["users", "admin"])
async def delete_item(item_id: int, auth=Depends(auth_user)):
    check_auth(auth, "admin")
    with db:
        item = Item.get_or_none(Item.id == item_id)
        if not item:
            raise HTTPException(404)
        item.delete_instance(recursive=True)

        # Now remove every picture
        for p in item.pictures:
            with contextlib.suppress(Exception):
                os.unlink(f"{LUDO_STORAGE}/img/{p}")
            with contextlib.suppress(Exception):
                os.unlink(f"{LUDO_STORAGE}/thumb/{p}")

        return "OK"


@router.get("/categories", tags=["categories"])
def get_categories():
    "Return all categories"
    with db:
        return list(Category.select().order_by(Category.name).dicts())


@router.post("/categories", tags=["categories", "admin"])
async def create_category(request: Request, auth=Depends(auth_user)):
    check_auth(auth, "admin")
    body = await request.json()
    with db:
        c = Category.create(name=body["name"])
        return model_to_dict(c)


@router.post("/categories/{cat_id}", tags=["categories", "admin"])
async def update_category(cat_id: int, request: Request, auth=Depends(auth_user)):
    check_auth(auth, "admin")
    body = await request.json()
    with db:
        Category.update(name=body["name"]).where(Category.id == cat_id).execute()
