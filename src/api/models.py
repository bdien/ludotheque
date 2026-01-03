import datetime

from pydantic import BaseModel, ConfigDict


class APIUserHistoryItem(BaseModel):
    id: int
    item: int
    name: str
    start: datetime.date
    stop: datetime.date


class APILoan(BaseModel):
    id: int
    item: int
    name: str | None = None
    start: datetime.date
    stop: datetime.date
    status: str | None = None


class APILoanWithUser(APILoan):
    user: int


class APIUser(BaseModel):
    id: int
    name: str
    enabled: bool
    role: str
    emails: list[str] = []
    bookings: list[int] = []
    credit: float
    notes: str | None = ""
    informations: str | None = ""
    subscription: datetime.date | None = None
    apikey: str | None = None
    created_at: datetime.date | None = None
    last_warning: datetime.date | None = None
    loans: list[APILoan] = []

    model_config = ConfigDict(from_attributes=True)


class APIItem(BaseModel):
    id: int
    name: str
    enabled: bool
    description: str | None = None
    players_min: int | None = None
    players_max: int | None = None
    gametime: int | None = None
    age: int | None = None
    big: bool = False
    outside: bool = False
    content: dict | None = None
    pictures: list[str] = []
    notes: str | None = None
    lastseen: datetime.date | None = None
    created_at: datetime.date | None = None

    model_config = ConfigDict(from_attributes=True)
