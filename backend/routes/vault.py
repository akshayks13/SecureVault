"""
Vault routes for storing and retrieving encrypted passwords and files.
Implements RBAC - users can only access their own data.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from database import get_db
from models import User, VaultItem, VaultItemType
from auth.jwt import get_current_user
from crypto.aes import generate_aes_key, encrypt_data, decrypt_data
from crypto.hashing import compute_sha256, verify_hash
from crypto.rsa import sign_data, verify_signature
from crypto.encoding import encode_base64, decode_base64

router = APIRouter(prefix="/vault", tags=["Vault"])


# Request/Response Models
class PasswordStoreRequest(BaseModel):
    name: str  # Label for the password (e.g., "Gmail", "Netflix")
    website: Optional[str] = None
    username: str
    password: str


class PasswordResponse(BaseModel):
    id: int
    name: str
    website: Optional[str]
    username: str
    password: str  # Decrypted password
    created_at: str


class VaultItemResponse(BaseModel):
    id: int
    type: str
    name: str
    file_name: Optional[str]
    created_at: str


class FileResponse(BaseModel):
    id: int
    name: str
    file_name: str
    created_at: str


class IntegrityResponse(BaseModel):
    valid: bool
    message: str


# Helper functions
def encrypt_and_store(data: bytes) -> tuple[str, str, str, str, str]:
    """
    Encrypt data and generate integrity proofs.
    
    Returns:
        Tuple of (encrypted_data_b64, key_b64, iv_b64, hash, signature_b64)
    """
    # Generate AES key and encrypt
    key = generate_aes_key()
    encrypted, iv = encrypt_data(data, key)
    
    # Compute hash for integrity
    data_hash = compute_sha256(data)
    
    # Sign the hash for authenticity
    signature = sign_data(data_hash.encode())
    
    # Encode to Base64 for storage
    return (
        encode_base64(encrypted),
        encode_base64(key),
        encode_base64(iv),
        data_hash,
        encode_base64(signature)
    )


def decrypt_and_verify(item: VaultItem) -> bytes:
    """
    Decrypt data and verify integrity.
    
    Args:
        item: VaultItem from database
        
    Returns:
        Decrypted data bytes
        
    Raises:
        HTTPException: If integrity check fails
    """
    # Decode from Base64
    encrypted = decode_base64(item.encrypted_data)
    key = decode_base64(item.encryption_key)
    iv = decode_base64(item.iv)
    signature = decode_base64(item.signature)
    
    # Decrypt
    decrypted = decrypt_data(encrypted, key, iv)
    
    # Verify hash
    if not verify_hash(decrypted, item.hash):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Data integrity check failed - hash mismatch"
        )
    
    # Verify signature
    if not verify_signature(item.hash.encode(), signature):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Data authenticity check failed - signature invalid"
        )
    
    return decrypted


# Password Routes
@router.post("/passwords", status_code=status.HTTP_201_CREATED)
async def store_password(
    request: PasswordStoreRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Store a new password securely.
    
    - Encrypts password with AES-256-GCM
    - Computes SHA-256 hash for integrity
    - Signs hash with RSA for authenticity
    - Stores in database (user can only access own passwords)
    """
    # Prepare data for encryption (JSON format)
    import json
    password_data = json.dumps({
        "website": request.website,
        "username": request.username,
        "password": request.password
    }).encode()
    
    # Encrypt and generate integrity proofs
    encrypted_b64, key_b64, iv_b64, data_hash, signature_b64 = encrypt_and_store(password_data)
    
    # Store in database
    vault_item = VaultItem(
        user_id=current_user.id,
        type=VaultItemType.PASSWORD.value,
        name=request.name,
        encrypted_data=encrypted_b64,
        encryption_key=key_b64,
        iv=iv_b64,
        hash=data_hash,
        signature=signature_b64
    )
    
    db.add(vault_item)
    db.commit()
    db.refresh(vault_item)
    
    return {"message": "Password stored securely", "id": vault_item.id}


@router.get("/passwords", response_model=List[PasswordResponse])
async def list_passwords(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all passwords for the current user.
    
    - RBAC: Only returns user's own passwords
    - Decrypts each password for display
    - Verifies integrity before returning
    """
    import json
    
    items = db.query(VaultItem).filter(
        VaultItem.user_id == current_user.id,
        VaultItem.type == VaultItemType.PASSWORD.value
    ).all()
    
    passwords = []
    for item in items:
        # Decrypt and verify
        decrypted = decrypt_and_verify(item)
        data = json.loads(decrypted.decode())
        
        passwords.append(PasswordResponse(
            id=item.id,
            name=item.name,
            website=data.get("website"),
            username=data["username"],
            password=data["password"],
            created_at=item.created_at.isoformat()
        ))
    
    return passwords


@router.get("/passwords/{item_id}", response_model=PasswordResponse)
async def get_password(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific password.
    
    - RBAC: Only owner can access
    """
    import json
    
    item = db.query(VaultItem).filter(
        VaultItem.id == item_id,
        VaultItem.user_id == current_user.id,
        VaultItem.type == VaultItemType.PASSWORD.value
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Password not found or access denied"
        )
    
    decrypted = decrypt_and_verify(item)
    data = json.loads(decrypted.decode())
    
    return PasswordResponse(
        id=item.id,
        name=item.name,
        website=data.get("website"),
        username=data["username"],
        password=data["password"],
        created_at=item.created_at.isoformat()
    )


@router.delete("/passwords/{item_id}")
async def delete_password(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a password.
    
    - RBAC: Only owner can delete
    """
    item = db.query(VaultItem).filter(
        VaultItem.id == item_id,
        VaultItem.user_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found or access denied"
        )
    
    db.delete(item)
    db.commit()
    
    return {"message": "Item deleted successfully"}


@router.put("/passwords/{item_id}")
async def update_password(
    item_id: int,
    request: PasswordStoreRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an existing password.
    
    - RBAC: Only owner can update
    - Re-encrypts with new key
    """
    import json
    
    item = db.query(VaultItem).filter(
        VaultItem.id == item_id,
        VaultItem.user_id == current_user.id,
        VaultItem.type == VaultItemType.PASSWORD.value
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Password not found or access denied"
        )
    
    # Re-encrypt with new content
    password_data = json.dumps({
        "website": request.website,
        "username": request.username,
        "password": request.password
    }).encode()
    
    encrypted_b64, key_b64, iv_b64, data_hash, signature_b64 = encrypt_and_store(password_data)
    
    item.name = request.name
    item.encrypted_data = encrypted_b64
    item.encryption_key = key_b64
    item.iv = iv_b64
    item.hash = data_hash
    item.signature = signature_b64
    
    db.commit()
    
    return {"message": "Password updated successfully"}


# File Routes
@router.post("/files", status_code=status.HTTP_201_CREATED)
async def upload_file(
    name: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and encrypt a file.
    
    - Reads file content
    - Encrypts with AES-256-GCM
    - Computes SHA-256 hash for integrity
    - Signs hash with RSA for authenticity
    - Stores encrypted file in database
    """
    # Read file content
    file_content = await file.read()
    
    # Encrypt and generate integrity proofs
    encrypted_b64, key_b64, iv_b64, data_hash, signature_b64 = encrypt_and_store(file_content)
    
    # Store in database
    vault_item = VaultItem(
        user_id=current_user.id,
        type=VaultItemType.FILE.value,
        name=name,
        file_name=file.filename,
        encrypted_data=encrypted_b64,
        encryption_key=key_b64,
        iv=iv_b64,
        hash=data_hash,
        signature=signature_b64
    )
    
    db.add(vault_item)
    db.commit()
    db.refresh(vault_item)
    
    return {"message": "File uploaded and encrypted", "id": vault_item.id}


@router.get("/files", response_model=List[FileResponse])
async def list_files(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all files for the current user.
    
    - RBAC: Only returns user's own files
    """
    items = db.query(VaultItem).filter(
        VaultItem.user_id == current_user.id,
        VaultItem.type == VaultItemType.FILE.value
    ).all()
    
    return [
        FileResponse(
            id=item.id,
            name=item.name,
            file_name=item.file_name,
            created_at=item.created_at.isoformat()
        )
        for item in items
    ]


@router.get("/files/{item_id}/download")
async def download_file(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download and decrypt a file.
    
    - RBAC: Only owner can download
    - Decrypts file
    - Verifies integrity and authenticity
    - Returns file content
    """
    item = db.query(VaultItem).filter(
        VaultItem.id == item_id,
        VaultItem.user_id == current_user.id,  # RBAC check
        VaultItem.type == VaultItemType.FILE.value
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or access denied"
        )
    
    # Decrypt and verify
    decrypted = decrypt_and_verify(item)
    
    # Determine content type
    import mimetypes
    content_type, _ = mimetypes.guess_type(item.file_name)
    if content_type is None:
        content_type = "application/octet-stream"
    
    return Response(
        content=decrypted,
        media_type=content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{item.file_name}"'
        }
    )


@router.get("/files/{item_id}/verify", response_model=IntegrityResponse)
async def verify_file_integrity(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify file integrity without downloading.
    
    - Checks hash and signature
    - Returns verification status
    """
    item = db.query(VaultItem).filter(
        VaultItem.id == item_id,
        VaultItem.user_id == current_user.id,
        VaultItem.type == VaultItemType.FILE.value
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or access denied"
        )
    
    try:
        decrypt_and_verify(item)
        return IntegrityResponse(
            valid=True,
            message="File integrity verified: hash and signature are valid"
        )
    except HTTPException as e:
        return IntegrityResponse(
            valid=False,
            message=e.detail
        )


# General Routes
@router.get("/items", response_model=List[VaultItemResponse])
async def list_all_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all vault items for the current user.
    
    - RBAC: Only returns user's own items
    """
    items = db.query(VaultItem).filter(
        VaultItem.user_id == current_user.id
    ).all()
    
    return [
        VaultItemResponse(
            id=item.id,
            type=item.type,
            name=item.name,
            file_name=item.file_name,
            created_at=item.created_at.isoformat()
        )
        for item in items
    ]


# Note Models
class NoteStoreRequest(BaseModel):
    title: str
    content: str


class NoteResponse(BaseModel):
    id: int
    title: str
    content: str
    created_at: str


# Note Routes
@router.post("/notes", status_code=status.HTTP_201_CREATED)
async def store_note(
    request: NoteStoreRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Store a new secure note.
    
    - Encrypts note content with AES-256-GCM
    - Computes SHA-256 hash for integrity
    - Signs hash with RSA for authenticity
    """
    import json
    note_data = json.dumps({
        "title": request.title,
        "content": request.content
    }).encode()
    
    encrypted_b64, key_b64, iv_b64, data_hash, signature_b64 = encrypt_and_store(note_data)
    
    vault_item = VaultItem(
        user_id=current_user.id,
        type=VaultItemType.NOTE.value,
        name=request.title,
        encrypted_data=encrypted_b64,
        encryption_key=key_b64,
        iv=iv_b64,
        hash=data_hash,
        signature=signature_b64
    )
    
    db.add(vault_item)
    db.commit()
    db.refresh(vault_item)
    
    return {"message": "Note stored securely", "id": vault_item.id}


@router.get("/notes", response_model=List[NoteResponse])
async def list_notes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all notes for the current user.
    """
    import json
    
    items = db.query(VaultItem).filter(
        VaultItem.user_id == current_user.id,
        VaultItem.type == VaultItemType.NOTE.value
    ).all()
    
    notes = []
    for item in items:
        decrypted = decrypt_and_verify(item)
        data = json.loads(decrypted.decode())
        
        notes.append(NoteResponse(
            id=item.id,
            title=data.get("title", item.name),
            content=data["content"],
            created_at=item.created_at.isoformat()
        ))
    
    return notes


@router.get("/notes/{item_id}", response_model=NoteResponse)
async def get_note(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific note."""
    import json
    
    item = db.query(VaultItem).filter(
        VaultItem.id == item_id,
        VaultItem.user_id == current_user.id,
        VaultItem.type == VaultItemType.NOTE.value
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Note not found")
    
    decrypted = decrypt_and_verify(item)
    data = json.loads(decrypted.decode())
    
    return NoteResponse(
        id=item.id,
        title=data.get("title", item.name),
        content=data["content"],
        created_at=item.created_at.isoformat()
    )


@router.put("/notes/{item_id}")
async def update_note(
    item_id: int,
    request: NoteStoreRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing note."""
    import json
    
    item = db.query(VaultItem).filter(
        VaultItem.id == item_id,
        VaultItem.user_id == current_user.id,
        VaultItem.type == VaultItemType.NOTE.value
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Re-encrypt with new content
    note_data = json.dumps({
        "title": request.title,
        "content": request.content
    }).encode()
    
    encrypted_b64, key_b64, iv_b64, data_hash, signature_b64 = encrypt_and_store(note_data)
    
    item.name = request.title
    item.encrypted_data = encrypted_b64
    item.encryption_key = key_b64
    item.iv = iv_b64
    item.hash = data_hash
    item.signature = signature_b64
    
    db.commit()
    
    return {"message": "Note updated"}


@router.delete("/notes/{item_id}")
async def delete_note(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a note."""
    item = db.query(VaultItem).filter(
        VaultItem.id == item_id,
        VaultItem.user_id == current_user.id,
        VaultItem.type == VaultItemType.NOTE.value
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(item)
    db.commit()
    
    return {"message": "Note deleted"}


# File Preview Route
@router.get("/files/{item_id}/preview")
async def preview_file(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Preview a file (images and PDFs).
    
    - Returns file content inline for preview
    - Supports images (jpg, png, gif, webp) and PDFs
    """
    item = db.query(VaultItem).filter(
        VaultItem.id == item_id,
        VaultItem.user_id == current_user.id,
        VaultItem.type == VaultItemType.FILE.value
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if file is previewable
    import mimetypes
    content_type, _ = mimetypes.guess_type(item.file_name)
    
    previewable_types = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf'
    ]
    
    if content_type not in previewable_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Preview not supported for this file type: {content_type}"
        )
    
    # Decrypt and verify
    decrypted = decrypt_and_verify(item)
    
    return Response(
        content=decrypted,
        media_type=content_type,
        headers={
            "Content-Disposition": f'inline; filename="{item.file_name}"'
        }
    )

