"""
AES encryption utilities for file and data encryption.
Uses AES-256-GCM for authenticated encryption.
"""
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def generate_aes_key() -> bytes:
    """
    Generate a random 256-bit AES key.
    
    Returns:
        32 bytes (256 bits) random key
    """
    return os.urandom(32)


def generate_iv() -> bytes:
    """
    Generate a random initialization vector for AES-GCM.
    
    Returns:
        12 bytes random IV (recommended size for GCM)
    """
    return os.urandom(12)


def encrypt_data(data: bytes, key: bytes, iv: bytes = None) -> tuple[bytes, bytes]:
    """
    Encrypt data using AES-256-GCM.
    
    Args:
        data: Plain bytes to encrypt
        key: 32-byte AES key
        iv: Optional 12-byte IV (generated if not provided)
        
    Returns:
        Tuple of (encrypted_data, iv)
    """
    if iv is None:
        iv = generate_iv()
    
    aesgcm = AESGCM(key)
    encrypted = aesgcm.encrypt(iv, data, None)
    
    return encrypted, iv


def decrypt_data(encrypted_data: bytes, key: bytes, iv: bytes) -> bytes:
    """
    Decrypt data using AES-256-GCM.
    
    Args:
        encrypted_data: Encrypted bytes (includes auth tag)
        key: 32-byte AES key
        iv: 12-byte IV used during encryption
        
    Returns:
        Decrypted plain bytes
        
    Raises:
        cryptography.exceptions.InvalidTag: If data was tampered with
    """
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(iv, encrypted_data, None)
