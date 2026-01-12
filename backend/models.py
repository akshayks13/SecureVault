from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from database import Base


class UserRole(str, enum.Enum):
    """User roles for RBAC."""
    USER = "user"
    ADMIN = "admin"


class User(Base):
    """User model for authentication."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRole.USER.value)
    otp = Column(String(6), nullable=True)
    otp_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to vault items
    vault_items = relationship("VaultItem", back_populates="owner")


class VaultItemType(str, enum.Enum):
    """Types of vault items."""
    PASSWORD = "password"
    FILE = "file"


class VaultItem(Base):
    """Vault item model for storing encrypted data."""
    __tablename__ = "vault_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(20), nullable=False)  # password or file
    name = Column(String(255), nullable=False)  # item name/label
    encrypted_data = Column(Text, nullable=False)  # Base64 encoded encrypted data
    encryption_key = Column(Text, nullable=False)  # Base64 encoded AES key (encrypted with master key)
    iv = Column(Text, nullable=False)  # Base64 encoded initialization vector
    hash = Column(String(64), nullable=False)  # SHA-256 hash for integrity
    signature = Column(Text, nullable=False)  # RSA signature for authenticity
    file_name = Column(String(255), nullable=True)  # Original filename for files
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to user
    owner = relationship("User", back_populates="vault_items")
