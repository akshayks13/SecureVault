"""
Team management routes for shared file vaults.

Role Permissions:
- OWNER: Full access - manage members, share files, view/download
- ADMIN: Share files, view/download (cannot manage members)
- MEMBER: View and download shared files only
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from database import get_db
from models import User, Team, TeamMember, TeamRole, SharedVaultItem, VaultItem, VaultItemType
from auth.jwt import get_current_user
from crypto.aes import decrypt_data
from crypto.encoding import decode_base64

router = APIRouter(prefix="/teams", tags=["Teams"])


# Request/Response Models
class CreateTeamRequest(BaseModel):
    name: str
    description: Optional[str] = None


class TeamResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_by: int
    member_count: int
    my_role: str

    class Config:
        from_attributes = True


class TeamMemberResponse(BaseModel):
    id: int
    user_id: int
    username: str
    role: str

    class Config:
        from_attributes = True


class AddMemberRequest(BaseModel):
    username: str
    role: str = "member"


class ShareFileRequest(BaseModel):
    vault_item_id: int


class SharedFileResponse(BaseModel):
    id: int
    name: str
    file_name: str
    shared_by_username: str
    created_at: str

    class Config:
        from_attributes = True


# Routes
@router.post("/", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    request: CreateTeamRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new team. Creator becomes the owner."""
    team = Team(
        name=request.name,
        description=request.description,
        created_by=current_user.id
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    
    # Add creator as owner
    member = TeamMember(
        team_id=team.id,
        user_id=current_user.id,
        role=TeamRole.OWNER.value
    )
    db.add(member)
    db.commit()
    
    return {
        "id": team.id,
        "name": team.name,
        "description": team.description,
        "created_by": team.created_by,
        "member_count": 1,
        "my_role": TeamRole.OWNER.value
    }


@router.get("/", response_model=List[TeamResponse])
async def get_my_teams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all teams the current user is a member of."""
    memberships = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).all()
    
    teams = []
    for membership in memberships:
        team = db.query(Team).filter(Team.id == membership.team_id).first()
        if team:
            member_count = db.query(TeamMember).filter(
                TeamMember.team_id == team.id
            ).count()
            teams.append({
                "id": team.id,
                "name": team.name,
                "description": team.description,
                "created_by": team.created_by,
                "member_count": member_count,
                "my_role": membership.role
            })
    
    return teams


@router.get("/{team_id}/members", response_model=List[TeamMemberResponse])
async def get_team_members(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all members of a team. Any member can view."""
    # Verify user is a member
    membership = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this team")
    
    members = db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
    
    result = []
    for member in members:
        user = db.query(User).filter(User.id == member.user_id).first()
        result.append({
            "id": member.id,
            "user_id": member.user_id,
            "username": user.username if user else "Unknown",
            "role": member.role
        })
    
    return result


@router.post("/{team_id}/members", status_code=status.HTTP_201_CREATED)
async def add_team_member(
    team_id: int,
    request: AddMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a member to the team.
    Only OWNER can add members.
    """
    # Verify caller is owner only
    membership = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id
    ).first()
    
    if not membership or membership.role != TeamRole.OWNER.value:
        raise HTTPException(status_code=403, detail="Only team owner can add members")
    
    # Find user to add
    user_to_add = db.query(User).filter(User.username == request.username).first()
    if not user_to_add:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already member
    existing = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user_to_add.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")
    
    # Add member (only allow admin or member roles, not owner)
    allowed_roles = [TeamRole.ADMIN.value, TeamRole.MEMBER.value]
    role = request.role if request.role in allowed_roles else TeamRole.MEMBER.value
    
    new_member = TeamMember(
        team_id=team_id,
        user_id=user_to_add.id,
        role=role
    )
    db.add(new_member)
    db.commit()
    
    return {"message": f"Added {request.username} as {role} to the team"}


@router.delete("/{team_id}/members/{user_id}")
async def remove_team_member(
    team_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a member from the team.
    Only OWNER can remove members.
    """
    # Verify caller is owner only
    membership = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id
    ).first()
    
    if not membership or membership.role != TeamRole.OWNER.value:
        raise HTTPException(status_code=403, detail="Only team owner can remove members")
    
    # Can't remove self (owner)
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Owner cannot remove themselves")
    
    member_to_remove = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user_id
    ).first()
    
    if not member_to_remove:
        raise HTTPException(status_code=404, detail="Member not found")
    
    db.delete(member_to_remove)
    db.commit()
    
    return {"message": "Member removed"}


@router.post("/{team_id}/share")
async def share_file_with_team(
    team_id: int,
    request: ShareFileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Share a FILE with the team.
    Only OWNER and ADMIN can share files.
    """
    # Verify user is owner or admin
    membership = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this team")
    
    if membership.role not in [TeamRole.OWNER.value, TeamRole.ADMIN.value]:
        raise HTTPException(status_code=403, detail="Only owner or admin can share files")
    
    # Get the vault item
    vault_item = db.query(VaultItem).filter(
        VaultItem.id == request.vault_item_id,
        VaultItem.user_id == current_user.id,
        VaultItem.type == VaultItemType.FILE.value  # Only files
    ).first()
    
    if not vault_item:
        raise HTTPException(status_code=404, detail="File not found in your vault")
    
    # Check if already shared
    existing = db.query(SharedVaultItem).filter(
        SharedVaultItem.team_id == team_id,
        SharedVaultItem.name == vault_item.name,
        SharedVaultItem.file_name == vault_item.file_name
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="This file is already shared with the team")
    
    # Create shared item
    shared_item = SharedVaultItem(
        team_id=team_id,
        shared_by=current_user.id,
        type=VaultItemType.FILE.value,
        name=vault_item.name,
        encrypted_data=vault_item.encrypted_data,
        encryption_key=vault_item.encryption_key,
        iv=vault_item.iv,
        hash=vault_item.hash,
        signature=vault_item.signature,
        file_name=vault_item.file_name
    )
    db.add(shared_item)
    db.commit()
    
    return {"message": f"Shared '{vault_item.name}' with the team"}


@router.get("/{team_id}/shared", response_model=List[SharedFileResponse])
async def get_shared_files(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all shared files in a team.
    All members can view.
    """
    # Verify user is member
    membership = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this team")
    
    shared_items = db.query(SharedVaultItem).filter(
        SharedVaultItem.team_id == team_id
    ).all()
    
    result = []
    for item in shared_items:
        sharer = db.query(User).filter(User.id == item.shared_by).first()
        result.append({
            "id": item.id,
            "name": item.name,
            "file_name": item.file_name or item.name,
            "shared_by_username": sharer.username if sharer else "Unknown",
            "created_at": item.created_at.isoformat()
        })
    
    return result


@router.get("/{team_id}/shared/{item_id}/download")
async def download_shared_file(
    team_id: int,
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download a shared file.
    All members can download.
    """
    # Verify user is member
    membership = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this team")
    
    # Get the shared item
    shared_item = db.query(SharedVaultItem).filter(
        SharedVaultItem.id == item_id,
        SharedVaultItem.team_id == team_id
    ).first()
    
    if not shared_item:
        raise HTTPException(status_code=404, detail="Shared file not found")
    
    # Decrypt the file
    try:
        encrypted_data = decode_base64(shared_item.encrypted_data)
        key = decode_base64(shared_item.encryption_key)
        iv = decode_base64(shared_item.iv)
        
        decrypted_data = decrypt_data(encrypted_data, key, iv)
        
        return Response(
            content=decrypted_data,
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f'attachment; filename="{shared_item.file_name}"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to decrypt file")


@router.delete("/{team_id}/shared/{item_id}")
async def remove_shared_file(
    team_id: int,
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a shared file.
    Only OWNER, ADMIN, or the original sharer can remove.
    """
    # Verify user is member
    membership = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this team")
    
    shared_item = db.query(SharedVaultItem).filter(
        SharedVaultItem.id == item_id,
        SharedVaultItem.team_id == team_id
    ).first()
    
    if not shared_item:
        raise HTTPException(status_code=404, detail="Shared file not found")
    
    # Check permission: owner, admin, or original sharer
    can_delete = (
        membership.role in [TeamRole.OWNER.value, TeamRole.ADMIN.value] or
        shared_item.shared_by == current_user.id
    )
    
    if not can_delete:
        raise HTTPException(status_code=403, detail="You don't have permission to remove this file")
    
    db.delete(shared_item)
    db.commit()
    
    return {"message": "Shared file removed"}


@router.delete("/{team_id}")
async def delete_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a team.
    Only OWNER can delete.
    """
    membership = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id
    ).first()
    
    if not membership or membership.role != TeamRole.OWNER.value:
        raise HTTPException(status_code=403, detail="Only team owner can delete the team")
    
    team = db.query(Team).filter(Team.id == team_id).first()
    if team:
        db.delete(team)
        db.commit()
    
    return {"message": "Team deleted"}
