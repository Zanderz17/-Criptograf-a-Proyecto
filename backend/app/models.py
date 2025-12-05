from sqlalchemy import BigInteger, Column, Text, LargeBinary, TIMESTAMP, func
from sqlalchemy.orm import relationship
from .db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(BigInteger, primary_key=True)
    email = Column(Text, unique=True, nullable=False)
    password_h = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

class Vault(Base):
    __tablename__ = "vaults"
    user_id = Column(BigInteger, primary_key=True)
    blob = Column(LargeBinary, nullable=False)
    etag = Column(Text, nullable=False)
    version = Column(BigInteger, nullable=False, default=1)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
