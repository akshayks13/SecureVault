"""
Password generator utility for creating strong random passwords.
"""
import secrets
import string


def generate_password(
    length: int = 16,
    include_uppercase: bool = True,
    include_lowercase: bool = True,
    include_digits: bool = True,
    include_special: bool = True,
    exclude_ambiguous: bool = False
) -> str:
    """
    Generate a cryptographically secure random password.
    
    Args:
        length: Length of password (8-128)
        include_uppercase: Include A-Z
        include_lowercase: Include a-z
        include_digits: Include 0-9
        include_special: Include !@#$%^&*
        exclude_ambiguous: Exclude similar looking chars (0O, 1lI)
        
    Returns:
        Generated password string
    """
    if length < 8:
        length = 8
    elif length > 128:
        length = 128
    
    # Build character set
    chars = ""
    required_chars = []
    
    if include_lowercase:
        lowercase = string.ascii_lowercase
        if exclude_ambiguous:
            lowercase = lowercase.replace('l', '')
        chars += lowercase
        required_chars.append(secrets.choice(lowercase))
    
    if include_uppercase:
        uppercase = string.ascii_uppercase
        if exclude_ambiguous:
            uppercase = uppercase.replace('I', '').replace('O', '')
        chars += uppercase
        required_chars.append(secrets.choice(uppercase))
    
    if include_digits:
        digits = string.digits
        if exclude_ambiguous:
            digits = digits.replace('0', '').replace('1', '')
        chars += digits
        required_chars.append(secrets.choice(digits))
    
    if include_special:
        special = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        chars += special
        required_chars.append(secrets.choice(special))
    
    # Fallback if no character types selected
    if not chars:
        chars = string.ascii_letters + string.digits
        required_chars = [secrets.choice(chars)]
    
    # Generate remaining characters
    remaining_length = length - len(required_chars)
    password_chars = required_chars + [secrets.choice(chars) for _ in range(remaining_length)]
    
    # Shuffle to avoid predictable positions
    secrets.SystemRandom().shuffle(password_chars)
    
    return ''.join(password_chars)


def calculate_password_strength(password: str) -> dict:
    """
    Calculate password strength score and provide feedback.
    
    Args:
        password: Password to analyze
        
    Returns:
        Dictionary with score (0-100), level (weak/fair/good/strong), and feedback
    """
    if not password:
        return {"score": 0, "level": "weak", "feedback": ["Password is empty"]}
    
    score = 0
    feedback = []
    
    length = len(password)
    
    # Length scoring (up to 30 points)
    if length >= 16:
        score += 30
    elif length >= 12:
        score += 20
    elif length >= 8:
        score += 10
    else:
        feedback.append("Use at least 8 characters")
    
    # Character variety (up to 40 points)
    has_lower = any(c.islower() for c in password)
    has_upper = any(c.isupper() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
    
    variety_count = sum([has_lower, has_upper, has_digit, has_special])
    score += variety_count * 10
    
    if not has_lower:
        feedback.append("Add lowercase letters")
    if not has_upper:
        feedback.append("Add uppercase letters")
    if not has_digit:
        feedback.append("Add numbers")
    if not has_special:
        feedback.append("Add special characters")
    
    # Uniqueness (up to 20 points)
    unique_chars = len(set(password))
    uniqueness_ratio = unique_chars / length if length > 0 else 0
    if uniqueness_ratio > 0.8:
        score += 20
    elif uniqueness_ratio > 0.6:
        score += 15
    elif uniqueness_ratio > 0.4:
        score += 10
    else:
        feedback.append("Avoid repeating characters")
    
    # Common patterns penalty (up to -20 points)
    common_patterns = ['123', '234', '345', 'abc', 'qwerty', 'password', 'admin']
    password_lower = password.lower()
    for pattern in common_patterns:
        if pattern in password_lower:
            score -= 10
            feedback.append(f"Avoid common patterns like '{pattern}'")
            break
    
    # Bonus for extra length (up to 10 points)
    if length >= 20:
        score += 10
    
    # Cap score
    score = max(0, min(100, score))
    
    # Determine level
    if score >= 80:
        level = "strong"
    elif score >= 60:
        level = "good"
    elif score >= 40:
        level = "fair"
    else:
        level = "weak"
    
    if not feedback:
        feedback = ["Password is strong!"]
    
    return {
        "score": score,
        "level": level,
        "feedback": feedback,
        "length": length,
        "has_lowercase": has_lower,
        "has_uppercase": has_upper,
        "has_digits": has_digit,
        "has_special": has_special
    }
