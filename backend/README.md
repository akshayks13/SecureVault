# SecureVault Backend

FastAPI backend for SecureVault - providing secure APIs for password, file, and note management with encryption and authentication.

## Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload
```

The server runs at `http://localhost:8000`
API documentation available at `http://localhost:8000/docs`

## Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── database.py             # SQLite database configuration
├── models.py               # SQLAlchemy models
├── requirements.txt        # Python dependencies
│
├── auth/                   # Authentication modules
│   ├── jwt.py              # JWT token generation and validation
│   └── otp.py              # OTP generation and verification
│
├── crypto/                 # Cryptography modules
│   ├── password.py         # bcrypt password hashing
│   ├── aes.py              # AES-256-GCM encryption/decryption
│   ├── rsa.py              # RSA-2048 digital signatures
│   ├── hashing.py          # SHA-256 integrity hashing
│   └── encoding.py         # Base64 encoding utilities
│
└── routes/                 # API route handlers
    ├── auth.py             # Authentication (register, login, OTP, reset)
    ├── vault.py            # Vault operations (passwords, files, notes)
    ├── teams.py            # Team management and file sharing
    └── utils.py            # Password generator and health check
```

## Database Models

### User
- id, username, hashed_password, role, created_at

### VaultItem
- id, user_id, type (password/file/note), name, encrypted_data
- encryption_key, iv, hash, signature, file_name, created_at

### Team
- id, name, description, created_by, created_at

### TeamMember
- id, team_id, user_id, role (owner/admin/member), joined_at

### SharedFile
- id, team_id, vault_item_id, shared_by, created_at

## API Routes

### Authentication (`/auth`)
- `POST /register` - Register new user
- `POST /login` - Login and send OTP
- `POST /verify-otp` - Verify OTP and get JWT
- `GET /me` - Get current user
- `POST /forgot-password` - Request reset token
- `POST /reset-password` - Reset password

### Vault (`/vault`)
- `POST /passwords` - Store password
- `GET /passwords` - List passwords
- `GET /passwords/{id}` - Get password
- `PUT /passwords/{id}` - Update password
- `DELETE /passwords/{id}` - Delete password
- `POST /files` - Upload file
- `GET /files` - List files
- `GET /files/{id}/download` - Download file
- `GET /files/{id}/preview` - Preview file
- `GET /files/{id}/verify` - Verify integrity
- `POST /notes` - Create note
- `GET /notes` - List notes
- `PUT /notes/{id}` - Update note
- `DELETE /notes/{id}` - Delete note

### Teams (`/teams`)
- `POST /` - Create team
- `GET /` - List user's teams
- `GET /{id}/members` - List members
- `POST /{id}/members` - Add member
- `DELETE /{id}/members/{user_id}` - Remove member
- `POST /{id}/share` - Share file
- `GET /{id}/shared` - List shared files
- `DELETE /{id}` - Delete team

### Utilities (`/utils`)
- `POST /generate-password` - Generate password
- `POST /check-password-strength` - Check strength
- `GET /password-health` - Health report

## Security Implementation

### Encryption Flow
1. Generate random AES-256 key
2. Encrypt data with AES-GCM (provides confidentiality + integrity)
3. Compute SHA-256 hash of plaintext
4. Sign hash with RSA-2048 private key
5. Store: encrypted_data, key, iv, hash, signature (all Base64 encoded)

### Decryption Flow
1. Decode Base64 values
2. Decrypt with AES-GCM
3. Verify SHA-256 hash matches
4. Verify RSA signature
5. Return plaintext only if all checks pass

### Authentication Flow
1. User registers with username/password
2. Password hashed with bcrypt (12 rounds)
3. Login validates credentials, generates 6-digit OTP
4. OTP valid for 5 minutes
5. Successful OTP verification returns JWT token
6. JWT used for all authenticated requests

## Technologies

- FastAPI - Web framework
- SQLAlchemy - ORM
- SQLite - Database
- python-jose - JWT tokens
- passlib - Password hashing (bcrypt)
- cryptography - AES/RSA operations
- pyotp - TOTP generation
- Pydantic - Data validation
