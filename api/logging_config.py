import logging
import os
from contextvars import ContextVar

# Holds the current request's ID so any log call made while handling that
# request automatically includes it — set by the middleware in api/main.py,
# read by _RequestIdFilter below. Default "-" covers log lines emitted
# outside a request (e.g. at startup).
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")


class _RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx.get()
        return True


def configure_logging() -> None:
    """Configure stdlib logging once at startup.

    Every log line carries a timestamp, level, logger name, and request ID
    so a production issue can be traced end-to-end via `gcloud logging read`
    filtered on a single request ID (also returned as the X-Request-ID
    response header) or on a user/record ID from an audit log line.
    """
    level = os.getenv("LOG_LEVEL", "INFO").upper()
    handler = logging.StreamHandler()
    handler.addFilter(_RequestIdFilter())
    handler.setFormatter(logging.Formatter(
        "%(asctime)s %(levelname)s [%(request_id)s] %(name)s: %(message)s"
    ))

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers = [handler]


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
