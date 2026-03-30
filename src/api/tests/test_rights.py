from api.system import _compute_rights


def test_right_user():
    rights = _compute_rights("user")
    assert not rights


def test_right_benevole():
    rights = _compute_rights("benevole")
    assert rights == []


def test_right_admin():
    rights = _compute_rights("admin")
    assert sorted(rights) == [
        "booking_create",
        "booking_delete",
        "booking_manage",
        "item_create",
        "item_delete",
        "item_manage",
        "loan_create",
        "loan_delete",
        "loan_manage",
        "system",
        "user_create",
        "user_delete",
        "user_list",
        "user_manage",
    ]
