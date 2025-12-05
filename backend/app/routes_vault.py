# app/routes_vault.py
from fastapi import APIRouter, Depends, HTTPException, Response, Body, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from hashlib import sha256

from .db import get_db
from .models import Vault
from .security import decode_token

router = APIRouter(prefix="/api", tags=["vault"])
security = HTTPBearer(auto_error=True)

def user_id_from_credentials(cred: HTTPAuthorizationCredentials) -> int:
    if not cred or not cred.scheme.lower() == "bearer":
        raise HTTPException(status_code=401, detail="missing token")
    return decode_token(cred.credentials)

def make_etag(user_id: int, version: int, blob: bytes) -> str:
    h = sha256(blob + str(user_id).encode() + str(version).encode()).hexdigest()[:16]
    return f'W/"{h}"'

@router.get(
    "/vault",
    responses={200: {"content": {"application/octet-stream": {}}}},
    summary="Get vault (bytes)",
)
def get_vault(
    cred: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    user_id = user_id_from_credentials(cred)
    row = db.query(Vault).filter_by(user_id=user_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="no vault")
    # devolvemos binario y el ETag en header
    return Response(
        content=row.blob,
        media_type="application/octet-stream",
        headers={"ETag": row.etag},
        status_code=200,
    )
@router.put(
    "/vault",
    responses={200: {"content": {"application/json": {}}}},
    summary="Put vault (bytes) with ETag",
)
def put_vault(
    body: bytes = Body(
        ...,
        media_type="application/octet-stream",
        description="Encrypted vault bytes (AES-GCM)",
    ),
    if_match: str | None = Header(
        None,
        description="Previous ETag for optimistic locking",
    ),
    cred: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    user_id = user_id_from_credentials(cred)

    row = db.query(Vault).filter_by(user_id=user_id).first()
    if row:
        # exige If-Match correcto
        if not if_match or if_match != row.etag:
            raise HTTPException(status_code=409, detail="etag mismatch")

        row.version += 1
        row.blob = body
        row.etag = make_etag(user_id, row.version, body)
        db.add(row)
        db.commit()
        return Response(status_code=200, headers={"ETag": row.etag})
    else:
        # primera escritura: no exigimos If-Match
        version = 1
        etag = make_etag(user_id, version, body)
        row = Vault(user_id=user_id, blob=body, version=version, etag=etag)
        db.add(row)
        db.commit()
        return Response(status_code=200, headers={"ETag": row.etag})
