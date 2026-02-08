from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .models import UserRole, IssueStatus

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str
    role: str = UserRole.CITIZEN

class UserResponse(UserBase):
    id: int
    role: str
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class IssueBase(BaseModel):
    type: str
    description: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    priority: Optional[str] = "Moderate"
    risk: Optional[str] = "Moderate"

class IssueCreate(IssueBase):
    pass

class IssueResponse(IssueBase):
    id: int
    image_url: Optional[str] = None
    status: str
    resolved_image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
