import os
import json
import peewee
import gspread
from api.pwmodels import db, User, Loan, Item, EMail

SHEET_ID = "1G8smBWLbcLIQwFoR6EiAawQDAAPJjQQIdLczJ1gcPN8"


def publish_gsheets():
    # Read credentials from envvar
    account_txt = os.getenv("GOOGLESERVICEACCOUNT")
    if not account_txt:
        print("No GoogleServiceAccount, stopping there")
        return
    account = json.loads(account_txt)

    gc = gspread.service_account_from_dict(account)
    sht = gc.open_by_key(SHEET_ID)

    wks = sht.worksheet("Adhérents")
    with db:
        users = (
            User.select(
                User,
                peewee.fn.Count(Loan.id).alias("loans"),
                peewee.fn.Min(Loan.stop).alias("oldest_loan"),
            )
            .left_outer_join(EMail)
            .switch()
            .left_outer_join(Loan, on=((Loan.user == User.id) & (Loan.status == "out")))
            .group_by(User.id)
        )

        data = [
            [
                user.id,
                user.name,
                user.email_set and user.email_set[0].email or "",
                user.enabled and " " or "Désactivé",
                user.loans / max(1, len(user.email_set)),
                user.oldest_loan and user.oldest_loan.strftime("%d/%m/%Y") or "",
                user.credit,
                user.subscription.strftime("%d/%m/%Y"),
                user.created_at.strftime("%d/%m/%Y"),
            ]
            for user in users
        ]
    range = f"A2:{chr(65+len(data[0]))}{len(data)+1}"
    wks.update(range_name=range, values=data)

    wks = sht.worksheet("Jeux")
    with db:
        # Subquery, all item loaned
        subquery = Loan.select(Loan.item_id, Loan.status).where(Loan.status == "out")
        query = Item.select(
            Item,
            subquery.c.status.alias("status"),
        ).order_by(Item.id)
        query = query.join(
            subquery, peewee.JOIN.LEFT_OUTER, on=subquery.c.item_id == Item.id
        )

        data = [
            [
                i.id,
                i.name,
                f"{i.players_min}-{i.players_max}",
                i.age,
                i.big and "Encombrant" or i.outside and "Extérieur" or " ",
                (i.status == "out")
                and "Emprunté"
                or (not i.enabled)
                and "Désactivé"
                or " ",
                i.created_at.strftime("%d/%m/%Y"),
            ]
            for i in query.objects()
        ]

    range = f"A2:{chr(65+len(data[0]))}{len(data)+1}"
    wks.update(range_name=range, values=data)
