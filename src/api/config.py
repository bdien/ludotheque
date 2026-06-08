from typing import Annotated, Any

import peewee
from fastapi import APIRouter, Body, Depends

from api.pwmodels import Config, db
from api.system import auth_user_required

__DEFAULTS: dict[str, str | int | dict[str, float | int]] = {
    "auth_domain": "dev-th8igg4x0hj35r1b.eu.auth0.com",
    "pricing": {
        "regular": 0.5,
        "big": 5,
        "big_associations": 7,
        "card": 12,
        "card_value": 14,
        "yearly": 10,
    },
    "loan_weeks": 3,
    "loan_maxitems": 8,
    "loan_extend_max": 1,
    "loan_extend_days": 15,
    "apikey_prefix": "akld",
    "image_max_dim": 800,
    "thumb_dim": 200,
    "email_sender": "laludodupoissonlune@gmail.com",
    "email_cc": "benoit.dien@gmail.com",
    "email_minperiod": 21,
    "email_minlate": 14,
    "item_new_days": 60,
}


def get_config_all() -> dict:
    need_close = db.is_closed()
    try:
        if need_close:
            db.connect()
        return __DEFAULTS | {row.key: row.value for row in Config.select()}
    except peewee.OperationalError:
        return {}
    finally:
        if need_close:
            db.close()


def get_config(key: str) -> str | int | dict[str, float | int] | None:
    need_close = db.is_closed()
    try:
        if need_close:
            db.connect()
        return Config.get(Config.key == key).value
    except Config.DoesNotExist, peewee.OperationalError:
        return __DEFAULTS.get(key)
    finally:
        if need_close:
            db.close()


router = APIRouter()


@router.get("/config", tags=["config"])
async def router_get_config(auth=Depends(auth_user_required)):
    auth.check_right("system")
    return get_config_all()


@router.post("/config", tags=["config"])
async def router_set_config(
    body: Annotated[dict[str, Any], Body()], auth=Depends(auth_user_required)
):
    auth.check_right("system")
    with db:
        for key, value in body.items():
            obj, created = Config.get_or_create(
                key=key,
                defaults={"value": value},
            )
            if not created:
                obj.value = value
                obj.save()
        return {"success": True}
