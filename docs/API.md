# API Documentation

Complete API reference for SecureVault backend.

## Base URL

```
http://localhost:8000
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## Auth Endpoints

### Register

```http
POST /auth/register
```

**Request Body:**
```json
{
    "username": "string",
    "password": "string"
}
```

**Response:** `201 Created`
```json
{
    "message": "User registered successfully",
    "user_id": 1
}
```

---

### Login

```http
POST /auth/login
```

**Request Body:**
```json
{
    "username": "string",
    "password": "string"
}
```

**Response:** `200 OK`
```json
{
    "message": "OTP sent",
    "username": "string"
}
```

Note: OTP is printed to backend console (demo mode).

---

### Verify OTP

```http
POST /auth/verify-otp
```

**Request Body:**
```json
{
    "username": "string",
    "otp": "123456"
}
```

**Response:** `200 OK`
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer"
}
```

---

### Get Current User

```http
GET /auth/me
```

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
    "id": 1,
    "username": "string",
    "role": "user"
}
```

---

### Forgot Password

```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
    "username": "string"
}
```

**Response:** `200 OK`
```json
{
    "message": "Reset token generated",
    "reset_token": "abc123..."
}
```

---

### Reset Password

```http
POST /auth/reset-password
```

**Request Body:**
```json
{
    "username": "string",
    "reset_token": "abc123...",
    "new_password": "string"
}
```

**Response:** `200 OK`
```json
{
    "message": "Password reset successful"
}
```

---

## Vault - Passwords

### Store Password

```http
POST /vault/passwords
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
    "name": "Gmail",
    "website": "gmail.com",
    "username": "user@gmail.com",
    "password": "secretpassword"
}
```

**Response:** `201 Created`
```json
{
    "message": "Password stored securely",
    "id": 1
}
```

---

### List Passwords

```http
GET /vault/passwords
```

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
[
    {
        "id": 1,
        "name": "Gmail",
        "website": "gmail.com",
        "username": "user@gmail.com",
        "password": "secretpassword",
        "created_at": "2024-01-20T10:30:00"
    }
]
```

---

### Get Password

```http
GET /vault/passwords/{id}
```

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
    "id": 1,
    "name": "Gmail",
    "website": "gmail.com",
    "username": "user@gmail.com",
    "password": "secretpassword",
    "created_at": "2024-01-20T10:30:00"
}
```

---

### Update Password

```http
PUT /vault/passwords/{id}
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
    "name": "Gmail Updated",
    "website": "gmail.com",
    "username": "newuser@gmail.com",
    "password": "newpassword"
}
```

**Response:** `200 OK`
```json
{
    "message": "Password updated successfully"
}
```

---

### Delete Password

```http
DELETE /vault/passwords/{id}
```

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
    "message": "Item deleted successfully"
}
```

---

## Vault - Files

### Upload File

```http
POST /vault/files?name=MyDocument
```

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data:**
- `file`: File to upload

**Response:** `201 Created`
```json
{
    "message": "File uploaded and encrypted",
    "id": 1
}
```

---

### List Files

```http
GET /vault/files
```

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
[
    {
        "id": 1,
        "name": "MyDocument",
        "file_name": "report.pdf",
        "created_at": "2024-01-20T10:30:00"
    }
]
```

---

### Download File

```http
GET /vault/files/{id}/download
```

**Headers:** `Authorization: Bearer <token>`

**Response:** File binary content with appropriate Content-Type header.

---

### Preview File

```http
GET /vault/files/{id}/preview
```

**Headers:** `Authorization: Bearer <token>`

**Response:** File content inline (for images and PDFs).

---

### Verify File Integrity

```http
GET /vault/files/{id}/verify
```

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
    "valid": true,
    "message": "File integrity verified: hash and signature are valid"
}
```

---

## Vault - Notes

### Create Note

```http
POST /vault/notes
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
    "title": "My Secret Note",
    "content": "This is confidential content..."
}
```

**Response:** `201 Created`
```json
{
    "message": "Note stored securely",
    "id": 1
}
```

---

### List Notes

```http
GET /vault/notes
```

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
[
    {
        "id": 1,
        "title": "My Secret Note",
        "content": "This is confidential content...",
        "created_at": "2024-01-20T10:30:00"
    }
]
```

---

### Update Note

```http
PUT /vault/notes/{id}
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
    "title": "Updated Title",
    "content": "Updated content..."
}
```

**Response:** `200 OK`
```json
{
    "message": "Note updated"
}
```

---

### Delete Note

```http
DELETE /vault/notes/{id}
```

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
    "message": "Note deleted"
}
```

---

## Teams

### Create Team

```http
POST /teams/
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
    "name": "Engineering Team",
    "description": "Shared files for engineering"
}
```

**Response:** `201 Created`
```json
{
    "message": "Team created",
    "team_id": 1
}
```

---

### List My Teams

```http
GET /teams/
```

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
[
    {
        "id": 1,
        "name": "Engineering Team",
        "description": "Shared files for engineering",
        "role": "owner",
        "member_count": 3
    }
]
```

---

### Add Team Member

```http
POST /teams/{team_id}/members
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
    "username": "newmember",
    "role": "member"
}
```

**Response:** `200 OK`
```json
{
    "message": "Member added"
}
```

---

### Share File with Team

```http
POST /teams/{team_id}/share
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
    "vault_item_id": 1
}
```

**Response:** `200 OK`
```json
{
    "message": "File shared with team"
}
```

---

## Utilities

### Generate Password

```http
POST /utils/generate-password
```

**Request Body:**
```json
{
    "length": 16,
    "include_uppercase": true,
    "include_lowercase": true,
    "include_digits": true,
    "include_special": true,
    "exclude_ambiguous": false
}
```

**Response:** `200 OK`
```json
{
    "password": "xK9#mP2$vL5@nQ8!",
    "strength": {
        "score": 4,
        "label": "Strong"
    }
}
```

---

### Check Password Strength

```http
POST /utils/check-password-strength
```

**Request Body:**
```json
{
    "password": "mypassword123"
}
```

**Response:** `200 OK`
```json
{
    "score": 2,
    "label": "Fair",
    "feedback": ["Add special characters", "Make it longer"]
}
```

---

### Password Health Report

```http
GET /utils/password-health
```

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
    "total_passwords": 10,
    "strong_passwords": 6,
    "weak_passwords": 2,
    "reused_passwords": 2,
    "score": 75,
    "level": "good"
}
```
