"""
Utility routes for password generation and analysis.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List

from auth.jwt import get_current_user
from models import User
from crypto.password_generator import generate_password, calculate_password_strength
from sqlalchemy.orm import Session
from database import get_db
from models import VaultItem, VaultItemType
from crypto.aes import decrypt_data
from crypto.encoding import decode_base64
from crypto.password_health import analyze_password_health
import json


router = APIRouter(prefix="/utils", tags=["Utilities"])


# Request/Response Models
class GeneratePasswordRequest(BaseModel):
    length: int = 16
    include_uppercase: bool = True
    include_lowercase: bool = True
    include_digits: bool = True
    include_special: bool = True
    exclude_ambiguous: bool = False


class GeneratePasswordResponse(BaseModel):
    password: str
    strength: dict


class CheckStrengthRequest(BaseModel):
    password: str


class CheckStrengthResponse(BaseModel):
    score: int
    level: str
    feedback: List[str]
    length: int
    has_lowercase: bool
    has_uppercase: bool
    has_digits: bool
    has_special: bool


# Routes
@router.post("/generate-password", response_model=GeneratePasswordResponse)
async def generate_password_endpoint(
    request: GeneratePasswordRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate a secure random password with customizable options.
    Requires authentication.
    """
    password = generate_password(
        length=request.length,
        include_uppercase=request.include_uppercase,
        include_lowercase=request.include_lowercase,
        include_digits=request.include_digits,
        include_special=request.include_special,
        exclude_ambiguous=request.exclude_ambiguous
    )
    
    strength = calculate_password_strength(password)
    
    return {"password": password, "strength": strength}


@router.post("/check-password-strength", response_model=CheckStrengthResponse)
async def check_password_strength_endpoint(
    request: CheckStrengthRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Check the strength of a given password.
    Requires authentication.
    """
    result = calculate_password_strength(request.password)
    return result


@router.get("/password-health")
async def get_password_health(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get password health report for current user.
    Analyzes all stored passwords for weakness and reuse.
    """
    # Get all password items for user
    password_items = db.query(VaultItem).filter(
        VaultItem.user_id == current_user.id,
        VaultItem.type == VaultItemType.PASSWORD.value
    ).all()
    
    # Decrypt passwords for analysis
    passwords = []
    for item in password_items:
        try:
            encrypted_data = decode_base64(item.encrypted_data)
            key = decode_base64(item.encryption_key)
            iv = decode_base64(item.iv)
            
            decrypted = decrypt_data(encrypted_data, key, iv)
            password_data = json.loads(decrypted.decode('utf-8'))
            
            passwords.append({
                'id': item.id,
                'name': item.name,
                'password': password_data.get('password', '')
            })
        except Exception as e:
            # Skip items that can't be decrypted
            continue
    
    # Analyze health
    health_report = analyze_password_health(passwords)
    
    return health_report

