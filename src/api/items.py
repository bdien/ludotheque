import base64
import contextlib
import csv
import datetime
import hashlib
import html
import io
import os
from typing import Annotated
from urllib.parse import quote

import peewee
from fastapi import APIRouter, Body, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, PlainTextResponse
from PIL import Image, UnidentifiedImageError

# Pillow safety limits
# Cap decoded pixel count to mitigate decompression bombs (default Pillow warns at
# ~89 Mpx; we set a hard error well above legitimate input but far below DoS sizes).
Image.MAX_IMAGE_PIXELS = 40_000_000
# Allowed input formats for uploaded pictures.
_ALLOWED_IMAGE_FORMATS = {"PNG", "JPEG", "WEBP", "AVIF", "GIF"}
# Maximum size of a single base64-encoded picture payload (~12 MB of decoded bytes).
_MAX_PICTURE_B64_LEN = 16 * 1024 * 1024
from playhouse.shortcuts import model_to_dict

from api.config import IMAGE_MAX_DIM, THUMB_DIM
from api.models import APICategory, APIItem
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
from api.system import AuthUser, auth_user, auth_user_required, log_event

LUDO_STORAGE = os.getenv("LUDO_STORAGE", "../../storage").removesuffix("/")

router = APIRouter()


@router.post("/items", tags=["items"])
async def create_item(
    request: Request, auth: Annotated[AuthUser, Depends(auth_user_required)]
):
    auth.check_right("item_create")
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
    category: int | None = None,
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
    if auth and auth.has_right("item_manage"):
        columns += (Item.lastseen, subquery.c.loanstop)

    query = Item.select(*columns)
    if nb:
        query = query.limit(nb)
    if q:
        query = query.where((Item.name ** f"%{q}%") | (Item.id ** f"%{q}%"))
    if category:
        query = query.join(ItemCategory).where(ItemCategory.category == category)

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
def export_items(auth: Annotated[AuthUser, Depends(auth_user_required)]):
    "Export CSV"

    auth.check_right("item_manage")
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
def get_items_lastseen(
    auth: Annotated[AuthUser, Depends(auth_user_required)], days: int = 365
):
    "Return a list of items sorted by lastseen and limit in time"

    auth.check_right("item_manage")
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
def get_items_nbloans(auth: Annotated[AuthUser, Depends(auth_user_required)]):
    auth.check_right("item_manage")
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
            Item.select(Item.id, Item.age, Item.name, Item.big)
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
    # Special case: id = 0 -> new user
    if item_id == 0:
        return APIItem(id=0, name="", age=8, enabled=True, players_min=2, players_max=4)

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

        # Remove fields if needed
        if not auth or not auth.has_right("item_manage"):
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
            if auth.has_right("booking_manage"):
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
                if not auth.has_right("item_manage"):
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

        # All user-controlled fields must be HTML-escaped to prevent XSS.
        name = html.escape(item.name or "", quote=True)
        description = html.escape(
            (item.description or "").replace("\n", " "), quote=True
        )

        out = "<!doctype html>\n<html>\n<head>\n"
        out += f"  <title>{name}</title>\n"
        out += f'  <meta property="og:title" content="{name}"/>\n'
        out += '  <meta property="og:type" content="website"/>\n'
        out += '  <meta property="og:site_name" content="Ludo du Poisson-Lune"/>\n'
        out += '  <meta property="og:locale" content="fr_FR"/>\n'
        out += f'  <meta property="og:url" content="https://ludotheque.fly.dev/items/{int(item.id)}"/>\n'
        out += f'  <meta property="og:description" content="{description}"/>\n'
        for i in item.pictures or []:
            # URL-encode the filename, then HTML-escape the resulting URL.
            safe_url = html.escape(
                f"https://ludotheque.fly.dev/storage/img/{quote(str(i), safe='')}",
                quote=True,
            )
            out += f'  <meta property="og:image" content="{safe_url}"/>\n'
        out += "</head>\n<body></body>\n</html>\n"
        return out


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

        # New pictures (base64-encoded bytes). Cap input size to prevent
        # memory/CPU exhaustion via huge payloads.
        if len(p) > _MAX_PICTURE_B64_LEN:
            raise HTTPException(413, "Picture too large")
        try:
            raw = base64.b64decode(p.split(",", 1)[1], validate=False)
        except (ValueError, IndexError) as e:
            raise HTTPException(400, "Invalid picture encoding") from e
        imgdata = io.BytesIO(raw)

        # Open and validate format/decompression-bomb safety.
        try:
            img = Image.open(imgdata)
            if img.format not in _ALLOWED_IMAGE_FORMATS:
                raise HTTPException(400, f"Unsupported image format: {img.format}")
            # Force decoding now so MAX_IMAGE_PIXELS / format errors raise here
            # rather than later in save().
            img.load()
        except (UnidentifiedImageError, Image.DecompressionBombError) as e:
            raise HTTPException(400, "Invalid or oversized image") from e
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
    item_id: int,
    request: Request,
    auth: Annotated[AuthUser, Depends(auth_user_required)],
):
    auth.check_right("item_manage")
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
    item_id: int,
    request: Request,
    auth: Annotated[AuthUser, Depends(auth_user_required)],
):
    "Add rating"

    body = await request.json()
    source = body.get("source", "website")
    weight = body.get("weight", 1)

    if (source != "website" or weight != 1) and not auth.has_right("item_manage"):
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
async def delete_item(
    item_id: int, auth: Annotated[AuthUser, Depends(auth_user_required)]
) -> str:
    "Delete an item"
    auth.check_right("item_delete")
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
def get_categories() -> list[APICategory]:
    "Return all categories"
    with db:
        return list(Category.select().order_by(Category.name).dicts())


@router.post("/categories", tags=["categories"])
async def create_category(
    name: Annotated[str, Body(embed=True)],
    auth: Annotated[AuthUser, Depends(auth_user_required)],
) -> APICategory:
    auth.check_right("item_manage")
    with db:
        return Category.create(name=name)


@router.post("/categories/{cat_id}", tags=["categories"])
async def update_category(
    cat_id: int,
    name: Annotated[str, Body(embed=True)],
    auth: Annotated[AuthUser, Depends(auth_user_required)],
) -> APICategory:
    auth.check_right("item_manage")
    with db:
        cats = (
            Category.update(name=name)
            .where(Category.id == cat_id)
            .returning(Category)
            .execute()
        )
        return cats[0]
