import logging
import sys
import uuid
from contextvars import ContextVar


request_id_var: ContextVar[str] = ContextVar("request_id", default="-")


class RequestIdFilter(logging.Filter):

    def filter(self, record):

        record.request_id = request_id_var.get()
        return True


def setup_logging(level: int = logging.INFO):

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            "%(asctime)s | %(levelname)s | req=%(request_id)s | %(name)s | %(message)s"
        )
    )
    handler.addFilter(RequestIdFilter())

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)


def new_request_id() -> str:

    request_id = str(uuid.uuid4())[:8]
    request_id_var.set(request_id)
    return request_id
