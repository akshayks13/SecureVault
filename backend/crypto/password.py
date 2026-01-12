"""
Password hashing utilities using bcrypt.
Implements secure password storage with salt.
"""
import bcrypt


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt with automatic salt generation.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string (includes salt)
    """
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a hashed password.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Stored hashed password
        
    Returns:
        True if password matches, False otherwise
    """
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )
