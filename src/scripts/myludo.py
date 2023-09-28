#!/usr/bin/env python3
import contextlib
import html
import os
import re
import json
import pathlib
import sys
import tempfile
import questionary
import requests
import argparse
from cli import Ludotheque


class MyLudo:
    def __init__(self):
        # Get session ID cookie
        self.session = requests.Session()

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
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
            }
        )

    def search(self, name, limit=18):
        r = self.session.get(
            f"https://www.myludo.fr/views/search/datas.php?type=search&tab=games&words={name}&limit={limit}&order=bymagic"
        )

        game_list = r.json()["list"]
        return {f'{i["title"]} ({i["id"]})': i["id"] for i in game_list}

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

        for i in "content", "description", "themes":
            desc[i] = game_info[i]

        return desc


def main():
    parser = argparse.ArgumentParser(description="")
    parser.add_argument("game_id", help="Game ID to search")
    parser.add_argument("--apikey", default=os.getenv("LUDOTHEQUE_APIKEY"))
    parser.add_argument("--json", "-j", help="Use JSON", type=pathlib.Path)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dryrun", action="store_true")
    args = parser.parse_args()

    if not args.apikey:
        parser.error("Please define LUDOTHEQUE_APIKEY or use --apikey")

    # Original game
    ludo = Ludotheque("https://ludotheque.fly.dev")
    ludo.auth_apikey(args.apikey)
    game = ludo.get_item(args.game_id)
    # Reverse categories
    categories = {i["name"].lower(): i["id"] for i in ludo.get_categories()}

    # Game from myludo
    if args.json and args.json.exists():
        myludo_game = json.loads(args.json.read_text())
    else:
        myludo = MyLudo()

        myludo_id = next(
            (i["ref"] for i in game.get("links") if i["name"] == "myludo"), None
        )
        # Search in MyLudo
        if not myludo_id:
            entries = myludo.search(game["name"])
            if not entries:
                sys.exit(f"Nothing found in myludo for '{game['name']}'")
            entry = questionary.select("Which game?", choices=entries.keys()).ask()
            myludo_id = entries[entry]

        # Query MyLudo
        myludo_game = myludo.game(myludo_id)

        if args.json:
            args.json.write_text(json.dumps(myludo_game, indent=2))
            print(f"'{args.json.as_posix()}' written")

    to_update = {}

    # Name
    if args.force:
        to_update["name"] = myludo_game["title"]

    # Description
    if args.force or not game.get("description"):
        desc = html.unescape(myludo_game["description"])
        desc = re.sub(r"<ul>(.*?)</ul>", r"\n\1", desc)
        desc = re.sub(r"<li>(.*?)</li>", r" - \1\n", desc)
        desc = re.sub(r"<u>(.*?)</u>", r"*\1*", desc)
        desc = re.sub(r"<b>(.*?)</b>", r"**\1**", desc)
        desc = (
            desc.replace("<h5>", "<h5>#")
            .replace("<p>", "\n\n")
            .replace("<br>", "\n")
            .replace("\t", "")
        )
        desc = re.sub("<.*?>", "", desc)
        to_update["description"] = desc.strip()

    # Links
    if args.force or not game.get("links"):
        to_update["links"] = [{"name": "myludo", "ref": myludo_game["id"]}]

    # Categories
    if args.force or not game.get("categories"):
        myludo_categories = (
            (myludo_game.get("themes") or {}).get("categorie", {}).values()
        )
        new_categories = []
        for cat in myludo_categories:
            if cat.lower() not in categories:
                print(f"Creating category '{cat}'")
                if not args.dryrun:
                    created = ludo.create_category({"name": cat})
                else:
                    created = {"id": "bogus", "name": cat}
                categories[created["name"].lower()] = created["id"]
            new_categories.append(categories[cat.lower()])
        to_update["categories"] = new_categories

    # Content
    if args.force or not game.get("content"):
        content = html.unescape(myludo_game.get("content"))
        content = re.sub("<.*?>", "", content.replace("</li>", "\n"))
        content = [line.strip() for line in content.split("\n") if line.strip()]
        to_update["content"] = content

    # Gametime
    if args.force or not game.get("gametime"):
        gametime = None
        with contextlib.suppress(ValueError):
            gametime = int(myludo_game.get("duration"))

        # Otherwise use community
        if not gametime:
            gametime = myludo_game.get("community", {}).get("duration")

        # Otherwise use main card, but could be a string
        if not gametime:
            gametime = myludo_game.get("duration").replace("—", "-")
            if "-" in str(gametime):
                (low, high) = (int(i) for i in gametime.split("-"))
                gametime = (high - low) // 2

        to_update["gametime"] = gametime

    # Filter everything empty
    to_update = {k: v for k, v in to_update.items() if v}

    if to_update:
        print("Updating item")
        print(to_update)
        if not args.dryrun:
            ludo.update_item(args.game_id, to_update)

    # Pictures
    if (not game.get("pictures")) and myludo_game.get("image"):
        for i in "S300", "S160", "S80":
            if uri := myludo_game["image"].get(i):
                print("Creating new item picture")
                if not args.dryrun:
                    with tempfile.NamedTemporaryFile(mode="wb") as tmpf:
                        r = requests.get(uri, timeout=120)
                        tmpf.write(r.content)
                        tmpf.flush()
                        ludo.create_item_picture(args.game_id, tmpf.name)
                break


if __name__ == "__main__":
    main()
