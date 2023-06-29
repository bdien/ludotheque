#!/usr/bin/env python3
import json
import pathlib
import questionary
import requests
import argparse
import re


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
        return {i["title"]: i["id"] for i in game_list}

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
    parser.add_argument("name", help="Game name to search")
    parser.add_argument("--output", "-o", help="Output JSON", type=pathlib.Path)
    args = parser.parse_args()

    myludo = MyLudo()
    entries = myludo.search(args.name)

    entry = questionary.select("Which game?", choices=entries.keys()).ask()

    game_info = myludo.game(entries[entry])

    if args.output:
        args.output.write_text(json.dumps(game_info, indent=2))
        print(f"'{args.output.as_posix()}' written")
    else:
        print(json.dumps(json.dumps(game_info, indent=2)))


if __name__ == "__main__":
    main()
