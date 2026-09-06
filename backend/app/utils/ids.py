import uuid


def new_id() -> str:
    return uuid.uuid4().hex


def new_request_id() -> str:
    return uuid.uuid4().hex
