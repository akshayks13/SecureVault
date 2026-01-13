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
    reset_token = Column(String(6), nullable=True)  # For password reset
    reset_token_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to vault items
    vault_items = relationship("VaultItem", back_populates="owner")


class VaultItemType(str, enum.Enum):
    """Types of vault items."""
    PASSWORD = "password"
    FILE = "file"
    NOTE = "note"


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


class TeamRole(str, enum.Enum):
    """Team member roles."""
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"


class Team(Base):
    """Team model for shared vaults."""
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    shared_items = relationship("SharedVaultItem", back_populates="team", cascade="all, delete-orphan")


class TeamMember(Base):
    """Team membership model."""
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), default=TeamRole.MEMBER.value)
    joined_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    team = relationship("Team", back_populates="members")
    user = relationship("User")


class SharedVaultItem(Base):
    """Shared vault item for teams."""
    __tablename__ = "shared_vault_items"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    shared_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(20), nullable=False)
    name = Column(String(255), nullable=False)
    encrypted_data = Column(Text, nullable=False)
    encryption_key = Column(Text, nullable=False)
    iv = Column(Text, nullable=False)
    hash = Column(String(64), nullable=False)
    signature = Column(Text, nullable=False)
    file_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    team = relationship("Team", back_populates="shared_items")
    sharer = relationship("User")

