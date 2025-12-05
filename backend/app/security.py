# app/security.py
import os, time, jwt
from passlib.hash import argon2

JWT_SECRET = os.getenv("JWT_SECRET", "dev")
JWT_ALG = os.getenv("JWT_ALG", "HS256")

def hash_password(pw: str) -> str:
    return argon2.hash(pw)

def verify_password(pw: str, hashed: str) -> bool:
    return argon2.verify(pw, hashed)

def create_token(user_id: int) -> str:
    now = int(time.time())
    payload = {"sub": str(user_id), "iat": now, "exp": now + 60*60*24*7}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def decode_token(token: str) -> int:
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    return int(payload["sub"])
