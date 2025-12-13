#!/usr/bin/env python3
import argparse
import os
import sys

import questionary
from boardgamegeek import BGGClient
from cli import Ludotheque


def main():
    parser = argparse.ArgumentParser(description="")
    parser.add_argument("game_id", help="Game ID to search")
    parser.add_argument("--id", help="Force BGG id")
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
    bgg = BGGClient(os.getenv("BGG_APIKEY"))

    bgg_id = args.id or next(
        (i["ref"] for i in game.get("links") if i["name"] == "bgg"), None
    )
    # Search in BGG
    bgg_game = None
    if bgg_id:
        bgg_game = bgg.game(game_id=bgg_id)

    if not bgg_game:
        games = bgg.games(game["name"])
        if not games:
            sys.exit(f"Nothing found in BGG for '{game['name']}'")
        if len(games) == 1:
            bgg_game = games[0]
        else:
            name = questionary.select(
                "Which game?", choices=[i.name for i in games]
            ).ask()
            bgg_game = next(i for i in games if i.name == name)

    # Query BGG
    to_update = {}

    # Links: Remove any previous link and add new one
    links = [i for i in game.get("links", []) if i["name"] != "bgg"]
    links.append({"name": "bgg", "ref": bgg_game._id})
    to_update["links"] = links

    # Ratings
    extra = {}
    if bgg_game.users_commented > 50:
        extra["rating"] = round(bgg_game.rating_average, 2)
        extra["complexity"] = round(bgg_game.rating_average_weight, 2)
    links[-1]["extra"] = extra

    # Filter everything empty
    to_update = {k: v for k, v in to_update.items() if v}

    if to_update:
        print("Updating item")
        print(args.game_id, to_update)
        if not args.dryrun:
            ludo.update_item(args.game_id, to_update)


if __name__ == "__main__":
    main()
