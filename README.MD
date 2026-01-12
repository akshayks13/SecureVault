# SecureVault

A secure digital vault application that allows users to store passwords and files using strong authentication, authorization, encryption, hashing, and encoding mechanisms.

## Security Features

| Concept | Implementation |
|---------|----------------|
| **Authentication** | Password + OTP (Multi-Factor Authentication) |
| **Authorization** | RBAC - Users can only access their own data |
| **Encryption** | AES-256-GCM for files and passwords |
| **Hashing** | bcrypt for passwords, SHA-256 for integrity |
| **Digital Signatures** | RSA-2048 with PSS padding for tamper detection |
| **Encoding** | Base64 for binary data transport |

## Project Structure

```
Cys_Proj/
├── backend/                 # FastAPI Backend
│   ├── main.py             # Application entry point
│   ├── database.py         # SQLite connection
│   ├── models.py           # User & VaultItem models
│   ├── auth/
│   │   ├── jwt.py          # JWT token handling
│   │   └── otp.py          # OTP generation/verification
│   ├── crypto/
│   │   ├── password.py     # bcrypt hashing
│   │   ├── aes.py          # AES-256-GCM encryption
│   │   ├── rsa.py          # RSA digital signatures
│   │   ├── hashing.py      # SHA-256 hashing
│   │   └── encoding.py     # Base64 encoding
│   └── routes/
│       ├── auth.py         # Register, Login, OTP routes
│       └── vault.py        # Password & File vault routes
│
└── frontend/               # Next.js Frontend
    └── src/
        ├── app/
        │   ├── page.js              # Landing page
        │   ├── login/page.js        # Login page
        │   ├── register/page.js     # Register page
        │   ├── verify-otp/page.js   # OTP verification
        │   ├── dashboard/page.js    # User dashboard
        │   └── vault/
        │       ├── passwords/page.js # Password manager
        │       └── files/page.js     # File storage
        ├── lib/api.js               # Axios API client
        └── context/AuthContext.js   # Auth state management
```

## Quick Start

### 1. Start the Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn main:app --reload
```

Backend will run at: `http://localhost:8000`

### 2. Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will run at: `http://localhost:3000`

## 🔑 API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register new user |
| `/auth/login` | POST | Login (sends OTP) |
| `/auth/verify-otp` | POST | Verify OTP, get JWT |
| `/auth/me` | GET | Get current user |

### Vault
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/vault/passwords` | POST | Store encrypted password |
| `/vault/passwords` | GET | List all passwords |
| `/vault/files` | POST | Upload encrypted file |
| `/vault/files` | GET | List all files |
| `/vault/files/{id}/download` | GET | Download decrypted file |
| `/vault/files/{id}/verify` | GET | Verify file integrity |

## 📝 Demo Flow

1. **Register** - Create account (password hashed with bcrypt)
2. **Login** - Enter credentials (OTP printed to backend console)
3. **Verify OTP** - Complete multi-factor authentication
4. **Store Password** - Add credentials (encrypted with AES-256)
5. **Upload File** - Store file (encrypted + signed)
6. **Verify Integrity** - Check file hasn't been tampered

## 🔍 Security Demonstration Points

- **Database Inspection**: All passwords are hashed, data is encrypted
- **Access Control**: Try accessing another user's data → 403 Forbidden
- **Tamper Detection**: Modify encrypted file → Signature verification fails
- **MFA**: Cannot login without valid OTP

## 📚 Technologies

- **Backend**: FastAPI, SQLAlchemy, python-jose, passlib, cryptography
- **Frontend**: Next.js 15, React, Axios
- **Database**: SQLite
- **Crypto**: AES-256-GCM, RSA-2048, bcrypt, SHA-256
