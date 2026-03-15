import datetime

import api.system
import api.users
from api.pwmodels import EMail, Item, Loan, User, db
from api.users import send_late_email


def test_sendmail_user(monkeypatch):

    with db:
        # Create user with late items
        user = User.create(name="u")
        EMail.create(email=["toto@toto.com"], user=user)
        item = Item.create(name="i")
        Loan.create(user=user, item=item, stop=datetime.date(2021, 11, 1))

        # Do not send email
        result = send_late_email(user, False)
        assert not result.sent

        # Simulate real email
        monkeypatch.setattr(api.users, "send_email", lambda *a: {"sent": True})
        result = send_late_email(user, True)
        print(result)
        assert result.sent
