from sqlalchemy import Boolean, Column, Integer, String, Float, DateTime, Enum
from .database import Base
import datetime
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    GOVT_WORKER = "govt_worker"
    CITIZEN = "citizen"

class IssueStatus(str, enum.Enum):
    PENDING = "PENDING"
    RESOLVED = "RESOLVED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default=UserRole.CITIZEN)

class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)
    description = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    image_url = Column(String)
    status = Column(String, default=IssueStatus.PENDING)
    resolved_image_url = Column(String, nullable=True)
    priority = Column(String, default="Moderate")
    risk = Column(String, default="Moderate")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
