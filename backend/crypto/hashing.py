"""
SHA-256 hashing utilities for data integrity verification.
"""
import hashlib


def compute_sha256(data: bytes) -> str:
    """
    Compute SHA-256 hash of data.
    
    Args:
        data: Bytes to hash
        
    Returns:
        Hexadecimal string of the hash (64 characters)
    """
    return hashlib.sha256(data).hexdigest()


def verify_hash(data: bytes, expected_hash: str) -> bool:
    """
    Verify that data matches the expected SHA-256 hash.
    
    Args:
        data: Bytes to verify
        expected_hash: Expected hexadecimal hash string
        
    Returns:
        True if hash matches, False otherwise
    """
    computed_hash = compute_sha256(data)
    return computed_hash == expected_hash
