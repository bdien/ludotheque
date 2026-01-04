import base64
import contextlib
import csv
import datetime
import hashlib
import io
import os
from typing import Annotated

import peewee
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, PlainTextResponse
from PIL import Image
from playhouse.shortcuts import model_to_dict

from api.config import IMAGE_MAX_DIM, THUMB_DIM
from api.pwmodels import (
    Booking,
    Category,
    Item,
    ItemCategory,
    ItemLink,
    Loan,
    Rating,
    db,
)
from api.system import AdminUser, AuthUser, BenevoleUser, auth_user, log_event

LUDO_STORAGE = os.getenv("LUDO_STORAGE", "../../storage").removesuffix("/")

router = APIRouter()


@router.post("/items", tags=["items"])
async def create_item(request: Request, auth: Annotated[AdminUser, Depends(auth_user)]):
    body = await request.json()

    # Avoid some properties
    params = {k: v for k, v in body.items() if k in Item._meta.fields}
    params = {k: v for k, v in params.items() if k not in ("created_at", "lastseen")}
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
                    item=item, name=i["name"], ref=i["ref"], extra=i.get("extra", {})
                ).on_conflict_replace().execute()

            # Insert item category
            for i in body.get("categories", []):
                ItemCategory.insert(
                    item=item, category=i
                ).on_conflict_ignore().execute()

            log_event(auth, f"Jeu '{item.name}' ({item.id}) créé")

            return model_to_dict(item)
        except peewee.IntegrityError as e:
            if e.args[0] == "UNIQUE constraint failed: item.id":
                raise HTTPException(
                    500, f"Le numéro '{params['id']}' est déjà utilisé"
                ) from None
            raise HTTPException(500, str(e)) from None


@router.get("/items", tags=["items"])
def get_items(
    auth: Annotated[AuthUser | None, Depends(auth_user)],
    nb: int = 0,
    sort: str | None = None,
    q: str | None = None,
):
    # Subquery (to add the last loan and extract status)
    subquery = Loan.select(
        Loan.item_id, peewee.fn.MAX(Loan.stop).alias("loanstop"), Loan.status
    ).group_by(Loan.item_id)

    columns = (
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
    if auth and auth.role == "admin":
        columns += (Item.lastseen, subquery.c.loanstop)

    query = Item.select(*columns)
    if nb:
        query = query.limit(nb)
    if q:
        query = query.where((Item.name ** f"%{q}%") | (Item.id ** f"%{q}%"))

    if sort == "created_at":
        query = query.order_by(Item.created_at.desc(), Item.id.desc())
    else:
        query = query.order_by(Item.id.asc())

    # Left join with the subquery
    query = query.join(
        subquery, peewee.JOIN.LEFT_OUTER, on=subquery.c.item_id == Item.id
    )

    with db:
        return list(query.dicts())


@router.get("/items/export", tags=["items"], response_class=PlainTextResponse)
def export_items(auth: Annotated[AdminUser, Depends(auth_user)]):
    "Export CSV"

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


@router.get("/items/lastseen", tags=["items"])
def get_items_lastseen(days: int = 365):
    "Return a list of items sorted by lastseen and limit in time"

    with db:
        start = datetime.date.today() - datetime.timedelta(days=days)
        return list(
            Item.select(Item.id, Item.age, Item.lastseen)
            .where(Item.lastseen < start)
            .where(Item.enabled)
            .where(Item.outside == False)  # noqa: E712
            .where(Item.big == False)  # noqa: E712
            .order_by(Item.lastseen.asc())
            .dicts()
        )


@router.get("/items/nbloans", tags=["items"])
def get_items_nbloans():
    with db:
        subquery = (
            Item.select(
                Item.id,
                peewee.fn.Count(Loan.id).alias("nbloans"),
            )
            .left_outer_join(Loan)
            .group_by(Item.id)
        )

        query = (
            Item.select(Item, subquery.c.nbloans)
            .order_by(subquery.c.nbloans.asc(), Item.id.desc())
            .left_outer_join(subquery, on=(Item.id == subquery.c.id))
            .where(Item.enabled)
            .limit(20)
        )

        return list(query.dicts())


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


@router.get("/items/{item_id}", tags=["item"])
def get_item(
    item_id: int,
    auth: Annotated[AuthUser | None, Depends(auth_user)],
):
    # Retrieve item + pictures + status (Limit to the last 10 loans)

    with db:
        items = (
            Item.select(Item, Loan)
            .left_outer_join(Loan)
            .limit(10)
            .where(Item.id == item_id)
            .order_by(-Loan.stop)
        )

        if not items:
            raise HTTPException(404)

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
            {"name": i.name, "ref": i.ref, "extra": i.extra}
            for i in ItemLink.select().where(ItemLink.item == item_id)
        ]

        # Remove fields for non-admin
        if not auth or auth.role != "admin":
            del base["notes"]
            del base["lastseen"]
            del base["created_at"]

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
        ratings = (
            Rating.select(
                Rating.source,
                peewee.fn.sum(Rating.weight * Rating.rating).alias("sum"),
                peewee.fn.sum(Rating.weight).alias("total"),
            )
            .where(Rating.item == item_id)
            .group_by(Rating.source)
        )
        base["ratings"] = {
            i.source: round(i.sum / i.total, 1) for i in ratings if i.total
        }

        if loans:
            base["status"] = loans[0].status
            if auth:
                base["return"] = loans[0].stop
                # Filter own loans
                if auth.role != "admin":
                    loans = [i for i in loans if i.user_id == auth.id]
                base["loans"] = [model_to_dict(i, recurse=False) for i in loans]

        return base


@router.get("/items/{item_id}/opengraph", tags=["item"], response_class=HTMLResponse)
def get_item_opengraph(item_id: int):
    # Render a public opengraph preview for bots
    with db:
        item = Item.get_or_none(Item.id == item_id)
        if not item:
            raise HTTPException(404)

        html = "<!doctype html>\n<html>\n<head>\n"
        html += f"  <title>{item.name}</title>\n"
        html += f'  <meta property="og:title" content="{item.name}"/>\n'
        html += '  <meta property="og:type" content="website"/>\n'
        html += '  <meta property="og:site_name" content="Ludo du Poisson-Lune"/>\n'
        html += '  <meta property="og:locale" content="fr_FR"/>\n'
        html += f'  <meta property="og:url" content="https://ludotheque.fly.dev/items/{item.id}"/>\n'
        description = item.description.replace("\n", "").replace('"', "&quot;")
        html += f'  <meta property="og:description" content="{description}"/>\n'
        for i in item.pictures:
            html += f'  <meta property="og:image" content="https://ludotheque.fly.dev/storage/img/{i}"/>\n'
        html += "</head>\n<body></body>\n</html>\n"
        return html


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


@router.post("/items/{item_id}", tags=["item"])
async def modify_item(
    item_id: int, request: Request, auth: Annotated[BenevoleUser, Depends(auth_user)]
):
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

        # Date format
        if "lastseen" in params:
            params["lastseen"] = datetime.date.fromisoformat(params["lastseen"])

        if params:
            Item.update(**params).where(Item.id == item_id).execute()

        # Modify item links
        for i in body.get("links", []):
            names = [i["name"] for i in body["links"]]
            ItemLink.delete().where(
                ItemLink.item == item_id, ItemLink.name.not_in(names)
            ).execute()
            ItemLink.insert(
                item=item_id, name=i["name"], ref=i["ref"], extra=i.get("extra", {})
            ).on_conflict_replace().execute()

        # Modify item categories
        for i in body.get("categories", []):
            ItemCategory.delete().where(
                ItemCategory.item == item_id,
                ItemCategory.category.not_in(body["categories"]),
            ).execute()
            ItemCategory.insert(item=item_id, category=i).on_conflict_ignore().execute()

    log_event(auth, f"Jeu '{item.name}' ({item.id}) modifié")

    return {"id": item.id}


@router.post("/items/{item_id}/rating", tags=["item"])
async def create_item_rating(
    item_id: int, request: Request, auth: Annotated[AuthUser, Depends(auth_user)]
):
    "Add rating"

    body = await request.json()
    source = body.get("source", "website")
    weight = body.get("weight", 1)

    if (source != "website" or weight != 1) and auth.role != "admin":
        raise HTTPException(403)

    with db:
        if source in ("myludo", "bgg"):
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


@router.delete("/items/{item_id}", tags=["item"])
async def delete_item(item_id: int, auth: Annotated[AdminUser, Depends(auth_user)]):
    "Delete an item"
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

        log_event(auth, f"Jeu '{item.name}' ({item.id}) supprimé")

        return "OK"


@router.get("/categories", tags=["categories"])
def get_categories():
    "Return all categories"
    with db:
        return list(Category.select().order_by(Category.name).dicts())


@router.post("/categories", tags=["categories"])
async def create_category(
    request: Request, auth: Annotated[AdminUser, Depends(auth_user)]
):
    body = await request.json()
    with db:
        c = Category.create(name=body["name"])
        return model_to_dict(c)


@router.post("/categories/{cat_id}", tags=["categories"])
async def update_category(
    cat_id: int, request: Request, auth: Annotated[AdminUser, Depends(auth_user)]
):
    body = await request.json()
    with db:
        Category.update(name=body["name"]).where(Category.id == cat_id).execute()
