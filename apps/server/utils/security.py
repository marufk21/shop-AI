import hashlib
import hmac
import secrets
from base64 import b64decode, b64encode

SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1
KEY_LENGTH = 64
SALT_LENGTH = 16


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(SALT_LENGTH)
    derived_key = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=SCRYPT_N,
        r=SCRYPT_R,
        p=SCRYPT_P,
        dklen=KEY_LENGTH,
    )
    return (
        f"scrypt${SCRYPT_N}${SCRYPT_R}${SCRYPT_P}$"
        f"{b64encode(salt).decode('ascii')}${b64encode(derived_key).decode('ascii')}"
    )


def verify_password(password: str, password_hash: str) -> bool:
    try:
        _, n, r, p, encoded_salt, encoded_key = password_hash.split("$", 5)
        salt = b64decode(encoded_salt.encode("ascii"))
        expected_key = b64decode(encoded_key.encode("ascii"))
    except ValueError:
        return False

    actual_key = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=int(n),
        r=int(r),
        p=int(p),
        dklen=len(expected_key),
    )
    return hmac.compare_digest(actual_key, expected_key)


def generate_session_token() -> str:
    return secrets.token_urlsafe(32)


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
