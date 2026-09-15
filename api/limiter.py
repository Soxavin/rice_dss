from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared rate limiter instance — imported by api/main.py and api/routers/auth.py.
# Kept in its own module so both sides can import it without a circular import
# (api/main.py imports routers, and routers need the limiter too).
limiter = Limiter(key_func=get_remote_address)
