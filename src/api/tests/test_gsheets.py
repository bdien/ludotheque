import datetime

import pytest

import api.gsheets
from api.pwmodels import Item, Loan, User, db


class FakeWorksheet:
    "Mimic a gspread worksheet, accumulate the values written"

    def __init__(self, title):
        self.title = title
        self.updates = []

    def update(self, range_name=None, values=None):
        self.updates.append(values)


class FakeSpreadsheet:
    def __init__(self):
        self.worksheets = {}

    def worksheet(self, title):
        if title not in self.worksheets:
            self.worksheets[title] = FakeWorksheet(title)
        return self.worksheets[title]


class FakeClient:
    def __init__(self, spreadsheet):
        self.spreadsheet = spreadsheet

    def open_by_key(self, key):
        return self.spreadsheet


@pytest.fixture
def fakesheet(monkeypatch):
    "Mock the Google connection, return the fake spreadsheet"

    spreadsheet = FakeSpreadsheet()
    monkeypatch.setenv("GOOGLESERVICEACCOUNT", "{}")
    monkeypatch.setattr(
        api.gsheets.gspread,
        "service_account_from_dict",
        lambda account: FakeClient(spreadsheet),
    )
    return spreadsheet


def jeux_rows(fakesheet):
    "Rows written in the 'Jeux' sheet"
    return fakesheet.worksheet("Jeux").updates[0]


def test_jeux_lastloan_not_limited_to_one_year(fakesheet):
    "Last loan date is displayed even for loans older than one year"

    with db:
        user = User.create(name="Bob")
        item = Item.create(name="Old game")
        start = datetime.date.today() - datetime.timedelta(days=400)
        stop = start + datetime.timedelta(days=15)
        Loan.create(item=item, user=user, start=start, stop=stop, status="returned")

    api.gsheets.publish_gsheets()

    row = jeux_rows(fakesheet)[0]
    # Number of loans is still restricted to the last year
    assert row[2] == 0
    # But the last loan date is displayed whatever its age
    assert row[9] == stop.strftime("%d/%m/%Y")


def test_jeux_recent_loan(fakesheet):
    "A loan started within the last year is counted and shows the borrower"

    with db:
        user = User.create(name="Alice")
        item = Item.create(name="Recent game")
        Loan.create(
            item=item,
            user=user,
            start=datetime.date.today() - datetime.timedelta(days=5),
            stop=datetime.date.today(),
            status="out",
        )

    api.gsheets.publish_gsheets()

    row = jeux_rows(fakesheet)[0]
    assert row[2] == 1
    assert row[6] == "Emprunté"
    assert row[7] == "Alice"


def test_jeux_never_loaned(fakesheet):
    "An item with no loan at all shows an empty last-loan date"

    with db:
        Item.create(name="Never loaned")

    api.gsheets.publish_gsheets()

    row = jeux_rows(fakesheet)[0]
    assert row[2] == 0
    assert row[9] == " "


def test_jeux_late_loans_wins_over_recent(fakesheet):
    "A loan started more than one year ago but stopped very recently shows up"

    with db:
        user = User.create(name="Carl")
        item = Item.create(name="Long loan")
        # A recent loan, already returned 5 days ago
        Loan.create(
            item=item,
            user=user,
            start=datetime.date.today() - datetime.timedelta(days=10),
            stop=datetime.date.today() - datetime.timedelta(days=5),
            status="returned",
        )
        # A very long loan, started 400 days ago, stopped only 2 days ago
        Loan.create(
            item=item,
            user=user,
            start=datetime.date.today() - datetime.timedelta(days=400),
            stop=datetime.date.today() - datetime.timedelta(days=2),
            status="returned",
        )

    api.gsheets.publish_gsheets()

    row = jeux_rows(fakesheet)[0]
    # Only 1 loan starts within the last year
    assert row[2] == 1
    # The last stop is the one from the old long loan
    assert row[9] == (datetime.date.today() - datetime.timedelta(days=2)).strftime(
        "%d/%m/%Y"
    )
