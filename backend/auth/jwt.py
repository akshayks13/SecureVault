"""
JWT token utilities for session management.
"""
import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import get_db
from models import User

# Load environment variables
load_dotenv()

# JWT Configuration from environment
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-key-change-in-production-12345")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

# HTTP Bearer token scheme
security = HTTPBearer()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    print(f"[JWT] Created token for user_id: {data.get('sub')}, token: {encoded_jwt[:50]}...")
    
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT token.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"[JWT] Decoded token successfully, payload: {payload}")
        return payload
    except JWTError as e:
        print(f"[JWT] Failed to decode token: {e}")
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    print(f"[JWT] Received token: {token[:50] if token else 'None'}...")
    
    payload = decode_token(token)
    
    if payload is None:
        print("[JWT] Payload is None, raising 401")
        raise credentials_exception
    
    user_id = payload.get("sub")
    print(f"[JWT] User ID from token: {user_id}, type: {type(user_id)}")
    
    if user_id is None:
        print("[JWT] User ID is None, raising 401")
        raise credentials_exception
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    print(f"[JWT] User from DB: {user.username if user else 'None'}")
    
    if user is None:
        print("[JWT] User not found in DB, raising 401")
        raise credentials_exception
    
    return user


def require_role(required_role: str):
    """
    Dependency factory for role-based access control.
    
    Args:
        required_role: Required role to access the resource
        
    Returns:
        Dependency function that validates user role
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {required_role}"
            )
        return current_user
    
    return role_checker
