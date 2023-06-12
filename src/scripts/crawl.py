#!/usr/bin/env python3
import requests
import logging
import re
import collections
import os
from api.pwmodels import Item, create_all_tables

Jeu = collections.namedtuple(
    "Jeu", "id, photo, nom, type, editeur, joueurs_min, joueurs_max, age, resume"
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


def get_one(i: int) -> Jeu:
    r = requests.get(f"http://ludoacigne.free.fr/jeux/jeu.php?id={i}", timeout=60)

    text = r.content.decode("Windows-1252")
    kv = dict(
        re.findall(
            '<td width="17%".*?>(.*?)</td><td width="83%">(.*?)\s*</td>',
            text,
            re.DOTALL,
        )
    )

    res = re.search('src="(.*?)"', kv.get("Photo", ""))
    photo = res[1] if res else None

    minj, maxj = parse_joueurs(kv["Nombre de joueurs"])
    minj = max(minj, 1)
    maxj = max(maxj, minj)
    return Jeu(
        i,
        photo,
        pretty_string(kv["Nom du jeu"]),
        pretty_string(kv["Type de jeu"]),
        pretty_string(kv["Editeur"]),
        minj,
        maxj,
        AGE_MAP[kv["Ages (à partir de...)&nbsp;"]],
        pretty_string(kv["Désignation"]).replace("\r", ""),
    )


def get_photo(url: str) -> bytes | None:
    r = requests.get(f"http://ludoacigne.free.fr/jeux/{url}", timeout=60)
    return None if r.status_code != 200 else r.content


logging.basicConfig(level=logging.DEBUG)

create_all_tables()


jeu = get_one(999)

ids = get_all()
bigs = get_all_big()
outside = get_all_outside()
for i in ids:
    obj = Item.get_or_none(Item.id == i)
    if obj:
        continue

    jeu = get_one(i)
    print(jeu)

    imgname = f"jeu_{i:05d}.jpg"
    filename = f"img/{imgname}"
    if jeu.photo and not os.path.exists(filename):
        if imgdata := get_photo(jeu.photo):
            with open(filename, "wb") as f:
                f.write(imgdata)
        else:
            imgname = None
    else:
        imgname = None

    Item.create(
        id=i,
        name=jeu.nom,
        description=jeu.resume,
        picture=imgname,
        players_min=jeu.joueurs_min,
        players_max=jeu.joueurs_max,
        age=jeu.age,
        big=i in bigs,
        outside=i in outside,
    )
