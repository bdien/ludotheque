import datetime
from pwmodels import User, Item, Loan, create_all_tables


create_all_tables()
u, created = User.get_or_create(name="Benoit", credit=1)

# Already returned
for item in (433, 935, 1003, 56, 75):
    i = Item.get_by_id(item)
    start = datetime.date.today() - datetime.timedelta(days=30)
    Loan.create(
        user=u,
        item=i,
        start=start,
        stop=start + datetime.timedelta(days=7),
        status="in",
    )

# Currently loaned
for item in (433, 936, 1004, 57, 76):
    i = Item.get_by_id(item)
    start = datetime.date.today()
    Loan.create(
        user=u,
        item=i,
        start=start,
        stop=start + datetime.timedelta(days=7),
        status="out",
    )

# and one late
i = Item.get_by_id(1000)
start = datetime.date.today() - datetime.timedelta(days=30)
Loan.create(
    user=u, item=i, start=start, stop=start + datetime.timedelta(days=7), status="out"
)
