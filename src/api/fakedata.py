import datetime
from pwmodels import User, Item, Loan, create_all_tables


create_all_tables()
u = User.create(name="Benoit")

i = Item.get_by_id(433)
start = datetime.date.today() - datetime.timedelta(days=30)
l = Loan.create(user=u, item=i, start=start, stop=start+datetime.timedelta(days=7), status="in")

i = Item.get_by_id(434)
start = datetime.date.today()
l = Loan.create(user=u, item=i, start=start, stop=start+datetime.timedelta(days=7), status="out")

