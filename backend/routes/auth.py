"""
Authentication routes for user registration, login, and OTP verification.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import User, UserRole
from crypto.password import hash_password, verify_password
from auth.jwt import create_access_token, get_current_user
from auth.otp import generate_otp, get_otp_expiry, verify_otp, simulate_send_otp

router = APIRouter(prefix="/auth", tags=["Authentication"])


# Request/Response Models
class RegisterRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class OTPVerifyRequest(BaseModel):
    username: str
    otp: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    message: str


# Routes
@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user.
    
    - Validates username is unique
    - Hashes password with bcrypt + salt
    - Generates OTP for verification
    - Stores user in database (inactive until OTP verified)
    """
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Validate password length
    if len(request.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )
    
    # Create new user with hashed password
    hashed_password = hash_password(request.password)
    
    # Generate OTP for verification
    otp = generate_otp()
    
    new_user = User(
        username=request.username,
        password_hash=hashed_password,
        role=UserRole.USER.value,
        otp=otp,
        otp_expiry=get_otp_expiry()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Simulate sending OTP (in production, send via email/SMS)
    simulate_send_otp(request.username, otp)
    
    return {"message": "Registration successful. Please verify OTP to activate your account."}


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp_route(request: OTPVerifyRequest, db: Session = Depends(get_db)):
    """
    Verify OTP after registration and activate account.
    
    - Verifies OTP matches and is not expired
    - Clears OTP from database
    - Issues JWT access token
    """
    # Find user
    user = db.query(User).filter(User.username == request.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username"
        )
    
    # Verify OTP
    if not verify_otp(request.otp, user.otp, user.otp_expiry):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP"
        )
    
    # Clear OTP after successful verification
    user.otp = None
    user.otp_expiry = None
    db.commit()
    
    # Create and return access token (sub must be string)
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with username and password.
    
    - Verifies username exists
    - Verifies password hash
    - Returns JWT token directly
    """
    # Find user
    user = db.query(User).filter(User.username == request.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Verify password
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Create and return access token (sub must be string)
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user info.
    
    - Requires valid JWT token
    - Returns user details
    """
    return current_user
