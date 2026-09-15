import os

from api.logging_config import get_logger

logger = get_logger("api.config")

_DEFAULT_JWT_SECRET = "change-me"

JWT_SECRET     = os.getenv("JWT_SECRET", _DEFAULT_JWT_SECRET)
JWT_ALGORITHM  = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MIN = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

if JWT_SECRET == _DEFAULT_JWT_SECRET:
    logger.warning(
        "JWT_SECRET is not set — falling back to an insecure default. "
        "This is fine for local dev/tests, but must never happen in a deployed environment."
    )
