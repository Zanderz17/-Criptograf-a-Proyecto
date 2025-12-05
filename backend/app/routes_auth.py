from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from .db import get_db
from .models import User
from .security import hash_password, verify_password, create_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

class SignupIn(BaseModel):
    email: EmailStr
    password: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup", status_code=200)
def signup(body: SignupIn, db: Session = Depends(get_db)):
    if db.query(User).filter_by(email=body.email).first():
        # Para UX simple: devuelve 200 aunque exista (idempotente)
        return {"ok": True}
    u = User(email=body.email, password_h=hash_password(body.password))
    db.add(u); db.commit()
    return {"ok": True}

@router.post("/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    u = db.query(User).filter_by(email=body.email).first()
    if not u or not verify_password(body.password, u.password_h):
        raise HTTPException(status_code=401, detail="invalid credentials")
    token = create_token(u.id)
    return {"token": token}
