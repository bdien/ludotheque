#!/usr/bin/env python3
import re
import requests
import logging
import re
import collections
import os
from pwmodels import Item, create_all_tables

Jeu = collections.namedtuple("Jeu", "id, nom, type, editeur, joueurs_min, joueurs_max, age, resume")

AGE_MAP = {
'10 ans et +': 10,
'2/3 ans': 2,
"4/5 ans": 4,
"6/7 ans": 6,
"8/9 ans": 8,
"9/18 mois": 0 }


def parse_joueurs(txt):
    if "à" not in txt:
        res = re.match("(\d+)", txt)
        return int(res.group(1)), int(res.group(1))

    res = re.match("(\d+)(?: joueurs)? à ([\d\+]+)(?: joueurs)?", txt)
    (min, max) = res.groups()
    if max == "+":
        max = "99"
    return int(min), int(max)


def get_all() -> list[int]:
    r = requests.get("http://ludoacigne.free.fr/jeux/liste_jeux.php?type=Tous", timeout=60)
    ids = re.findall('<td style="text-align: center">(\d+)</td>', r.text)
    return (int(i) for i in ids)

def pretty_string(txt: str) -> str:
    newtxt = txt.replace("\xa0", "").strip(". ")
    return ". ".join(i.strip().capitalize() for i in newtxt.split("."))

def get_one(id: int) -> Jeu:
    r = requests.get(f"http://ludoacigne.free.fr/jeux/jeu.php?id={id}", timeout=60)

    text = r.content.decode("Windows-1252")
    kv = dict(
        re.findall('<td width="17%".*?>(.*?)</td><td width="83%">(.*?)\s*</td>', text, re.DOTALL)
    )

    min, max = parse_joueurs(kv["Nombre de joueurs"])
    if min <= 1:
        min=1
    if max < min:
        max = min

    return Jeu(
        id,
        pretty_string(kv["Nom du jeu"]),
        pretty_string(kv["Type de jeu"]),
        pretty_string(kv["Editeur"]),
        min, max,
        AGE_MAP[kv["Ages (à partir de...)&nbsp;"]],
        pretty_string(kv["Désignation"]).replace("\r", "")
    )

def get_photo(id: int) -> bytes | None:
    r = requests.get(f"http://ludoacigne.free.fr/jeux/images/jeux_{id}.jpg", timeout=60)
    if r.status_code != 200:
        return None
    return r.content


logging.basicConfig(level=logging.DEBUG)

create_all_tables()


jeu = get_one(999)

ids = get_all()
for id in ids:

    obj = Item.get_or_none(Item.id == id)
    if obj:
        continue

    jeu = get_one(id)
    print(jeu)

    imgname = f"jeu_{id}.jpg"
    filename = f"img/{imgname}"
    if not os.path.exists(filename):
        imgdata = get_photo(id)
        if imgdata:
            with open(filename, "wb") as f:
                f.write(imgdata)
        else:
            imgname = None

    Item.create(id=id, name=jeu.nom, description=jeu.resume, picture=imgname, players_min=jeu.joueurs_min, players_max=jeu.joueurs_max, age=jeu.age)
