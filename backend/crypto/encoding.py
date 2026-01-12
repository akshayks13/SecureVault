"""
Base64 encoding utilities for binary data transport.
"""
import base64


def encode_base64(data: bytes) -> str:
    """
    Encode binary data to Base64 string.
    
    Args:
        data: Binary data to encode
        
    Returns:
        Base64 encoded string
    """
    return base64.b64encode(data).decode('utf-8')


def decode_base64(data: str) -> bytes:
    """
    Decode Base64 string to binary data.
    
    Args:
        data: Base64 encoded string
        
    Returns:
        Decoded binary data
    """
    return base64.b64decode(data.encode('utf-8'))
