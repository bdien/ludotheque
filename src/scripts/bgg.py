#!/usr/bin/env python3
import argparse
import json
import os
import re
import sys

import diskcache
import questionary
import requests
from cli import Ludotheque


class BGG:
    def __init__(self):
        # Get session ID cookie
        self.session = requests.Session()
        self.cache = diskcache.Cache(".ludoweb_cache")

        # Add headers
        self.session.headers.update({"referer": "https://boardgamegeek.com/"})
        self.session.headers.update(
            {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
            }
        )
        self.session.headers.update({"accept": "application/json, text/plain, */*"})

    def search(self, name, limit=18):
        # Cache
        data = self.cache.get(f"bgg_search_{name}")
        if not data:
            r = self.session.get(
                f"https://boardgamegeek.com/search/boardgame?nosession=1&q={name}&showcount=20"
            )
            data = r.json()
            self.cache.set(f"bgg_search_{name}", data, expire=604800)  # 1 week

        return {f"{i['name']} ({i['id']})": i["id"] for i in data["items"]}

    def game(self, game_id: int) -> dict:
        # Get game description
        # r = self.session.get(
        #     f"https://boardgamegeek.com/boardgame/{game_id}"
        # )
        # desc = r.json()
        desc = {"id": game_id}

        # Cache
        data = self.cache.get(f"bgg_stats_{game_id}")
        if not data:
            # Get statistics
            r = self.session.get(
                f"https://boardgamegeek.com/boardgame/{game_id}/stats/stats"
            )
            jsonstr = re.search(r"GEEK.geekitemPreload = (.*?);\n", r.text)
            data = json.loads(jsonstr[1])
            self.cache.set(f"bgg_stats_{game_id}", data, expire=604800)  # 1 week

        stats = data["item"]["stats"]
        desc["rating"] = float(stats["average"])
        desc["complexity"] = float(stats["avgweight"])

        return desc


def main():
    parser = argparse.ArgumentParser(description="")
    parser.add_argument("game_id", help="Game ID to search")
    parser.add_argument("--apikey", default=os.getenv("LUDOTHEQUE_APIKEY"))
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dryrun", action="store_true")
    args = parser.parse_args()

    if not args.apikey:
        parser.error("Please define LUDOTHEQUE_APIKEY or use --apikey")

    # Original game
    ludo = Ludotheque("https://ludotheque.fly.dev")
    ludo.auth_apikey(args.apikey)
    game = ludo.get_item(args.game_id)

    # Game from myludo
    bgg = BGG()

    bgg_id = next((i["ref"] for i in game.get("links") if i["name"] == "bgg"), None)
    # Search in BGG
    if not bgg_id:
        entries = bgg.search(game["name"])
        if not entries:
            sys.exit(f"Nothing found in BGG for '{game['name']}'")
        entry = questionary.select("Which game?", choices=entries.keys()).ask()
        bgg_id = entries[entry]

    # Query BGG
    bgg_game = bgg.game(bgg_id)

    to_update = {}

    # Links: Remove any previous link and add new one
    links = [i for i in game.get("links", []) if i["name"] != "bgg"]
    links.append({"name": "bgg", "ref": bgg_game["id"]})
    to_update["links"] = links

    # Ratings
    extra = {}
    if bgg_game.get("rating"):
        extra["rating"] = round(bgg_game["rating"], 2)
    if bgg_game.get("complexity"):
        extra["complexity"] = round(bgg_game["complexity"], 2)
    links[-1]["extra"] = extra

    # Filter everything empty
    to_update = {k: v for k, v in to_update.items() if v}

    if to_update:
        print("Updating item")
        print(to_update)
        if not args.dryrun:
            ludo.update_item(args.game_id, to_update)


if __name__ == "__main__":
    main()
