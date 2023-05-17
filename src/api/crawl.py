#!/usr/bin/env python3
import requests
import logging
import re
import collections
import os
from pwmodels import Item, create_all_tables

Jeu = collections.namedtuple(
    "Jeu", "id, nom, type, editeur, joueurs_min, joueurs_max, age, resume"
)

AGE_MAP = {
    "10 ans et +": 10,
    "2/3 ans": 2,
    "4/5 ans": 4,
    "6/7 ans": 6,
    "8/9 ans": 8,
    "9/18 mois": 0,
}


def parse_joueurs(txt):
    if "à" not in txt:
        res = re.match("(\d+)", txt)
        return int(res[1]), int(res[1])

    res = re.match("(\d+)(?: joueurs)? à ([\d\+]+)(?: joueurs)?", txt)
    (minj, maxj) = res.groups()
    if maxj == "+":
        maxj = "99"
    return int(minj), int(maxj)


def get_all() -> list[int]:
    r = requests.get(
        "http://ludoacigne.free.fr/jeux/liste_jeux.php?type=Tous", timeout=60
    )
    ids = re.findall('<td style="text-align: center">(\d+)</td>', r.text)
    return [int(i) for i in ids]


def get_all_big() -> list[int]:
    r = requests.get(
        "http://ludoacigne.free.fr/jeux/liste_jeux.php?type=surdim", timeout=60
    )
    ids = re.findall('<td style="text-align: center">(\d+)</td>', r.text)
    return [int(i) for i in ids]


def get_all_outside() -> list[int]:
    r = requests.get(
        "http://ludoacigne.free.fr/jeux/liste_jeux.php?type=exterieur", timeout=60
    )
    ids = re.findall('<td style="text-align: center">(\d+)</td>', r.text)
    return [int(i) for i in ids]


def pretty_string(txt: str) -> str:
    newtxt = txt.replace("\xa0", "").strip(". ")
    return ". ".join(i.strip().capitalize() for i in newtxt.split("."))


def get_one(id: int) -> Jeu:
    r = requests.get(f"http://ludoacigne.free.fr/jeux/jeu.php?id={id}", timeout=60)

    text = r.content.decode("Windows-1252")
    kv = dict(
        re.findall(
            '<td width="17%".*?>(.*?)</td><td width="83%">(.*?)\s*</td>',
            text,
            re.DOTALL,
        )
    )

    minj, maxj = parse_joueurs(kv["Nombre de joueurs"])
    minj = max(minj, 1)
    maxj = max(maxj, minj)
    return Jeu(
        id,
        pretty_string(kv["Nom du jeu"]),
        pretty_string(kv["Type de jeu"]),
        pretty_string(kv["Editeur"]),
        minj,
        maxj,
        AGE_MAP[kv["Ages (à partir de...)&nbsp;"]],
        pretty_string(kv["Désignation"]).replace("\r", ""),
    )


def get_photo(id: int) -> bytes | None:
    r = requests.get(f"http://ludoacigne.free.fr/jeux/images/jeux_{id}.jpg", timeout=60)
    return None if r.status_code != 200 else r.content


logging.basicConfig(level=logging.DEBUG)

create_all_tables()


jeu = get_one(999)

ids = get_all()
bigs = get_all_big()
outside = get_all_outside()
for id in ids:
    obj = Item.get_or_none(Item.id == id)
    if obj:
        continue

    jeu = get_one(id)
    print(jeu)

    imgname = f"jeu_{id}.jpg"
    filename = f"img/{imgname}"
    if not os.path.exists(filename):
        if imgdata := get_photo(id):
            with open(filename, "wb") as f:
                f.write(imgdata)
        else:
            imgname = None

    Item.create(
        id=id,
        name=jeu.nom,
        description=jeu.resume,
        picture=imgname,
        players_min=jeu.joueurs_min,
        players_max=jeu.joueurs_max,
        age=jeu.age,
        big=id in bigs,
        outside=id in outside,
    )
