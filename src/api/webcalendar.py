from collections import defaultdict
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from icalendar import Calendar, Event

from api.pwmodels import Item, Loan, User, db

router = APIRouter()


@router.get("/calendar/{calendar_token}.ics", tags=["calendar"])
def get_calendar_feed(calendar_token: str):
    """Public iCal feed of a user's active loans, grouped by return date."""
    with db:
        user = User.get_or_none(User.calendar_token == calendar_token)
        if not user:
            raise HTTPException(404)

        loans = (
            Loan.select(Loan.stop, Item.name)
            .join(Item)
            .where(Loan.user == user, Loan.status == "out")
            .order_by(Loan.stop)
            .dicts()
        )

        # Group loans by stop date
        by_date: dict[str, list[str]] = defaultdict(list)
        for loan in loans:
            by_date[loan["stop"]].append(loan["name"])

    cal = Calendar()
    cal.add("prodid", "-//Ludothèque du Poisson Lune//FR")
    cal.add("version", "2.0")
    cal.add("x-wr-calname", "Ludothèque")

    for stop_date, names in by_date.items():
        event = Event()
        plural = "x" if len(names) > 1 else ""
        event.add("summary", f"Ludothèque: Jeu{plural} à rendre")
        event.add(
            "description",
            f"{len(names)} jeu{plural} à rendre:\n - " + "\n - ".join(names),
        )
        event.add(
            "dtstart",
            datetime(
                stop_date.year,
                stop_date.month,
                stop_date.day,
                10,
                30,
                tzinfo=ZoneInfo("Europe/Paris"),
            ),
        )
        event.add(
            "dtend",
            datetime(
                stop_date.year,
                stop_date.month,
                stop_date.day,
                12,
                0,
                tzinfo=ZoneInfo("Europe/Paris"),
            ),
        )
        event.add("uid", f"loan-{user.id}-{stop_date}@ludotheque")
        cal.add_component(event)

    return Response(
        content=cal.to_ical(),
        media_type="text/calendar",
        headers={
            "Content-Disposition": f'attachment; filename="emprunts-{user.id}.ics"'
        },
    )
