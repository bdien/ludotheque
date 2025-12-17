import datetime
import os
import re

import requests_cache
from boardgamegeek import BGGClient

from api.pwmodels import ItemLink, db

MIN_RATINGS = 40


class MyLudo:
    def __init__(self):
        # Get session ID cookie
        self.session = requests_cache.CachedSession(
            "myludo", backend="memory", expire_after=604800
        )  # 1 week

        # Find CSRF-Token
        r = self.session.get("https://www.myludo.fr/#!/home")
        res = re.search('name="csrf-token" content="(.*?)"', r.text)
        if not res:
            raise RuntimeError("Cannot find CSRF Token")

        # Add headers
        self.session.headers.update({"x-csrf-token": res[1]})
        self.session.headers.update({"referer": "https://www.myludo.fr/"})
        self.session.headers.update(
            {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
            }
        )

    def search(self, name, limit=18):
        r = self.session.get(
            f"https://www.myludo.fr/views/search/datas.php?type=search&tab=games&words={name}&limit={limit}&order=bymagic"
        )
        data = r.json()["list"]
        return {f"{i['title']} ({i['id']})": i["id"] for i in data}

    def game(self, game_id: int) -> dict:
        r = self.session.get(
            f"https://www.myludo.fr/views/game/datas.php?type=game&id={game_id}"
        )
        desc = r.json()

        # New requests to get content + descriptions
        r = self.session.get(
            f"https://www.myludo.fr/views/game/datas.php?type=info&id={game_id}"
        )
        game_info = r.json()

        # Ratings
        desc["ratings"] = {}
        if desc.get("rating"):
            game_rating = desc["rating"]["game"]
            if "sharing" in game_rating:
                desc["ratings"] = {
                    int(k): v["audience"]
                    for k, v in game_rating["sharing"].items()
                    if v != 0
                }
            else:
                desc["ratings"] = {game_rating["average"]: game_rating["audience"]}

        for i in "content", "description", "themes":
            desc[i] = game_info[i]

        return desc


def update_olditems(nb: int):
    "Update items which have not been refreshed recently"

    with db:
        old_links = (
            ItemLink.select()
            .where(
                ItemLink.name.in_(["bgg", "myludo"]),
                (
                    ItemLink.refreshed_at
                    < datetime.date.today() - datetime.timedelta(days=30)
                ),
            )
            .order_by(ItemLink.refreshed_at.asc())
            .limit(nb)
        )

        bgg = BGGClient(os.getenv("BGG_APIKEY", ""))
        myludo = MyLudo()

        for link in old_links:
            if link.name == "bgg":
                _update_item_bgg(bgg, link)
            elif link.name == "myludo":
                _update_item_myludo(myludo, link)


def _update_item_bgg(bgg, bgg_link):
    "Update an item with BGG ratings"

    bgg_game = bgg.game(game_id=int(bgg_link.ref))
    if bgg_game and bgg_game.users_commented and bgg_game.users_commented > MIN_RATINGS:
        if bgg_game.rating_average:
            rating = round(bgg_game.rating_average, 2)
        if bgg_game.rating_average_weight:
            complexity = round(bgg_game.rating_average_weight, 2)

        bgg_link.extra = {
            "rating": rating,
            "complexity": complexity,
        }

    bgg_link.refreshed_at = datetime.date.today()
    bgg_link.save()


def _update_item_myludo(myludo, myludo_link):
    "Update an item with myludo ratings"

    myludo_game = myludo.game(int(myludo_link.ref))
    ratings = myludo_game.get("ratings", {})
    nbratings = sum(ratings.values())

    if nbratings > MIN_RATINGS:
        average = sum(k * v for k, v in ratings.items()) / nbratings
        rating = round(average, 2)

        myludo_link.extra = {
            "rating": rating,
        }

    myludo_link.refreshed_at = datetime.date.today()
    myludo_link.save()
