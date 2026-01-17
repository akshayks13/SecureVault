# SecureVault

A secure digital vault application for storing passwords, files, and notes with end-to-end encryption, multi-factor authentication, and role-based access control.

## Security Features

| Security Concept | Implementation |
|------------------|----------------|
| Authentication | Password + OTP (Multi-Factor Authentication) |
| Authorization | Role-based access control (RBAC) - users can only access their own data |
| Encryption | AES-256-GCM for all stored data (passwords, files, notes) |
| Hashing | bcrypt for password storage, SHA-256 for data integrity verification |
| Digital Signatures | RSA-2048 with PSS padding for tamper detection |
| Encoding | Base64 for binary data transport |

## Features

### Password Management
- Store and organize passwords with labels, websites, and usernames
- Edit and update existing passwords
- Password strength meter with real-time feedback
- Password generator with customizable options (length, character types)
- Password health report showing weak, reused, and strong passwords

### File Storage
- Upload and download encrypted files
- File integrity verification with hash and signature checks
- File preview for images and PDFs
- Tamper detection alerts

### Secure Notes
- Create, edit, and delete encrypted notes
- Full-text content storage with encryption

### Teams and Collaboration
- Create teams for shared file access
- Role-based permissions (Owner, Admin, Member)
- Share encrypted files with team members
- Manage team membership

### User Management
- User registration with secure password hashing
- Multi-factor authentication with OTP
- Forgot password flow with reset tokens
- User profile with security status

## Project Structure

```
SecureVault/
├── backend/                    # FastAPI Backend
│   ├── main.py                # Application entry point
│   ├── database.py            # SQLite database configuration
│   ├── models.py              # SQLAlchemy models (User, VaultItem, Team)
│   ├── auth/
│   │   ├── jwt.py             # JWT token generation and validation
│   │   └── otp.py             # OTP generation and verification
│   ├── crypto/
│   │   ├── password.py        # bcrypt password hashing
│   │   ├── aes.py             # AES-256-GCM encryption/decryption
│   │   ├── rsa.py             # RSA digital signatures
│   │   ├── hashing.py         # SHA-256 integrity hashing
│   │   └── encoding.py        # Base64 encoding utilities
│   └── routes/
│       ├── auth.py            # Authentication endpoints
│       ├── vault.py           # Password, file, and note endpoints
│       ├── teams.py           # Team management endpoints
│       └── utils.py           # Password generator and health check
│
└── frontend/                   # Next.js Frontend
    └── src/
        ├── app/
        │   ├── page.js                 # Landing page
        │   ├── login/                  # Login page
        │   ├── register/               # Registration page
        │   ├── verify-otp/             # OTP verification
        │   ├── forgot-password/        # Password recovery
        │   ├── reset-password/         # Password reset
        │   ├── dashboard/              # User dashboard
        │   ├── profile/                # User profile
        │   ├── password-health/        # Password health report
        │   ├── teams/                  # Team management
        │   └── vault/
        │       ├── passwords/          # Password manager
        │       ├── files/              # File storage
        │       └── notes/              # Secure notes
        ├── components/
        │   ├── Navbar.js               # Navigation bar
        │   ├── Footer.js               # Footer component
        │   ├── PasswordGenerator.js    # Password generator widget
        │   └── PasswordStrengthMeter.js # Strength indicator
        ├── context/
        │   └── AuthContext.js          # Authentication state
        └── lib/
            └── api.js                  # Axios API client
```

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend runs at: `http://localhost:3000`

## Demo Flow

1. **Register** - Create an account (password hashed with bcrypt)
2. **Login** - Enter credentials (OTP is printed to the backend console for demo)
3. **Verify OTP** - Complete multi-factor authentication
4. **Store Passwords** - Add credentials (encrypted with AES-256-GCM)
5. **Upload Files** - Store files (encrypted and digitally signed)
6. **Create Notes** - Write secure notes (encrypted storage)
7. **Check Health** - View password health report
8. **Create Teams** - Collaborate with shared encrypted files

## Security Demonstration

- **Database Inspection**: All passwords are hashed, all data is encrypted
- **Access Control**: Attempting to access another user's data returns 403 Forbidden
- **Tamper Detection**: Modifying encrypted data causes signature verification to fail
- **MFA Requirement**: Login requires valid OTP verification
- **Password Strength**: Weak passwords are identified in health reports

## Technologies

### Backend
- FastAPI - Modern Python web framework
- SQLAlchemy - Database ORM
- SQLite - Database
- python-jose - JWT handling
- passlib - Password hashing (bcrypt)
- cryptography - AES and RSA operations
- pyotp - OTP generation

### Frontend
- Next.js 16 - React framework
- React 19 - UI library
- Axios - HTTP client
- Framer Motion - Animations
- Lucide React - Icons

### Cryptography
- AES-256-GCM - Symmetric encryption for data
- RSA-2048 with PSS - Digital signatures
- bcrypt - Password hashing
- SHA-256 - Integrity hashing
- Base64 - Binary encoding
