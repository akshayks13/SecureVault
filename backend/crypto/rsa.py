"""
RSA utilities for digital signatures and key exchange.
Uses RSA-2048 with PSS padding for signatures.
"""
import os
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend

# Path to store RSA keys
KEYS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "keys")
PRIVATE_KEY_PATH = os.path.join(KEYS_DIR, "private_key.pem")
PUBLIC_KEY_PATH = os.path.join(KEYS_DIR, "public_key.pem")


def generate_rsa_keypair():
    """
    Generate a new RSA-2048 key pair.
    
    Returns:
        Tuple of (private_key, public_key) objects
    """
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    public_key = private_key.public_key()
    
    return private_key, public_key


def save_keys(private_key, public_key):
    """
    Save RSA keys to PEM files.
    """
    os.makedirs(KEYS_DIR, exist_ok=True)
    
    # Save private key
    with open(PRIVATE_KEY_PATH, "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ))
    
    # Save public key
    with open(PUBLIC_KEY_PATH, "wb") as f:
        f.write(public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ))


def load_private_key():
    """
    Load the private key from file, or generate if not exists.
    
    Returns:
        RSA private key object
    """
    if not os.path.exists(PRIVATE_KEY_PATH):
        private_key, public_key = generate_rsa_keypair()
        save_keys(private_key, public_key)
        return private_key
    
    with open(PRIVATE_KEY_PATH, "rb") as f:
        return serialization.load_pem_private_key(
            f.read(),
            password=None,
            backend=default_backend()
        )


def load_public_key():
    """
    Load the public key from file, or generate if not exists.
    
    Returns:
        RSA public key object
    """
    if not os.path.exists(PUBLIC_KEY_PATH):
        private_key, public_key = generate_rsa_keypair()
        save_keys(private_key, public_key)
        return public_key
    
    with open(PUBLIC_KEY_PATH, "rb") as f:
        return serialization.load_pem_public_key(
            f.read(),
            backend=default_backend()
        )


def sign_data(data: bytes) -> bytes:
    """
    Sign data using RSA-PSS with SHA-256.
    
    Args:
        data: Data bytes to sign
        
    Returns:
        Signature bytes
    """
    private_key = load_private_key()
    
    signature = private_key.sign(
        data,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    
    return signature


def verify_signature(data: bytes, signature: bytes) -> bool:
    """
    Verify an RSA-PSS signature.
    
    Args:
        data: Original data bytes
        signature: Signature bytes to verify
        
    Returns:
        True if signature is valid, False otherwise
    """
    public_key = load_public_key()
    
    try:
        public_key.verify(
            signature,
            data,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return True
    except Exception:
        return False
