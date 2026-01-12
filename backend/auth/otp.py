"""
OTP (One-Time Password) utilities for multi-factor authentication.
"""
import random
import string
from datetime import datetime, timedelta

# OTP Configuration
OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 5


def generate_otp() -> str:
    """
    Generate a random 6-digit OTP.
    
    Returns:
        6-digit numeric string
    """
    return ''.join(random.choices(string.digits, k=OTP_LENGTH))


def get_otp_expiry() -> datetime:
    """
    Get the expiry time for a new OTP.
    
    Returns:
        Datetime when OTP expires
    """
    return datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)


def verify_otp(user_otp: str, stored_otp: str, expiry: datetime) -> bool:
    """
    Verify an OTP against stored value and check expiry.
    
    Args:
        user_otp: OTP entered by user
        stored_otp: OTP stored in database
        expiry: Expiry datetime of the OTP
        
    Returns:
        True if OTP is valid and not expired, False otherwise
    """
    if stored_otp is None or expiry is None:
        return False
    
    # Check if OTP has expired
    if datetime.utcnow() > expiry:
        return False
    
    # Check if OTP matches
    return user_otp == stored_otp


def simulate_send_otp(username: str, otp: str):
    """
    Simulate sending OTP via email/SMS.
    In production, this would integrate with an email/SMS service.
    
    Args:
        username: User to send OTP to
        otp: The OTP code
    """
    print(f"\n{'='*50}")
    print(f"📧 OTP for user '{username}': {otp}")
    print(f"{'='*50}\n")
