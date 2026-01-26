# SecureVault Security Architecture

This document explains the security mechanisms used in SecureVault and why each was chosen.

## Overview

SecureVault implements defense-in-depth security with multiple layers:

```mermaid
flowchart TB
    subgraph "Layer 1: Authentication"
        A[Password + bcrypt] --> B[OTP Verification]
        B --> C[JWT Token]
    end
    
    subgraph "Layer 2: Authorization"
        C --> D[RBAC Check]
        D --> E[User can only access own data]
    end
    
    subgraph "Layer 3: Data Protection"
        E --> F[AES-256-GCM Encryption]
        F --> G[SHA-256 Integrity Hash]
        G --> H[RSA Digital Signature]
    end
    
    subgraph "Layer 4: Storage"
        H --> I[Base64 Encoding]
        I --> J[SQLite Database]
    end
```

---

## Cryptographic Components

### 1. bcrypt (Password Hashing)

**What it does:** Converts user login passwords into irreversible hashes.

**Why bcrypt (not SHA-256 or MD5)?**

| Algorithm | Speed | Security |
|-----------|-------|----------|
| MD5 | Very fast | Broken, collisions found |
| SHA-256 | Very fast | Secure but too fast for passwords |
| bcrypt | Intentionally slow | Designed for passwords |

bcrypt is slow by design - this makes brute-force attacks impractical:
- SHA-256: Attacker can try billions of passwords/second
- bcrypt: Attacker limited to thousands/second

**Code location:** `backend/crypto/password.py`

```mermaid
flowchart LR
    A["Password: 'mypassword123'"] --> B[Generate Random Salt]
    B --> C[bcrypt Hash Function]
    C --> D["$2b$12$LQv3c...hashed..."]
    D --> E[Store in Database]
```

---

### 2. AES-256-GCM (Data Encryption)

**What it does:** Encrypts vault data (passwords, files, notes) so only the key holder can read them.

**Why AES-256-GCM (not AES-CBC or RSA)?**

| Mode | Confidentiality | Integrity | Performance |
|------|-----------------|-----------|-------------|
| AES-CBC | Yes | No (needs separate MAC) | Fast |
| AES-GCM | Yes | Yes (built-in) | Fast |
| RSA | Yes | No | Slow, size-limited |

GCM mode provides authenticated encryption - it detects if ciphertext was modified.

**Key details:**
- Key size: 256 bits (32 bytes) - military-grade
- IV size: 96 bits (12 bytes) - unique per encryption
- Fresh random key generated for each vault item

**Code location:** `backend/crypto/aes.py`

```mermaid
flowchart LR
    subgraph "Encryption"
        A[Plaintext] --> B[AES-256-GCM]
        C[Random Key 32 bytes] --> B
        D[Random IV 12 bytes] --> B
        B --> E[Ciphertext + Auth Tag]
    end
    
    subgraph "Decryption"
        E --> F[AES-256-GCM]
        C --> F
        D --> F
        F --> G{Auth Tag Valid?}
        G -->|Yes| H[Plaintext]
        G -->|No| I[Reject - Tampered!]
    end
```

---

### 3. SHA-256 (Integrity Hashing)

**What it does:** Creates a unique fingerprint of data to detect modifications.

**Why SHA-256?**
- Produces 256-bit hash (64 hex characters)
- Collision-resistant (no two different inputs produce same hash)
- Industry standard for integrity verification

**Code location:** `backend/crypto/hashing.py`

```mermaid
flowchart LR
    A["File: report.pdf (2MB)"] --> B[SHA-256]
    B --> C["Hash: 9f86d081884c..."]
    
    D["Modified file"] --> E[SHA-256]
    E --> F["Hash: 7c211433f0..."]
    
    C -.->|Compare| G{Match?}
    F -.->|Compare| G
    G -->|No| H[File was tampered!]
```

---

### 4. RSA-2048 with PSS (Digital Signatures)

**What it does:** Proves data originated from this server and hasn't been tampered.

**Why RSA-PSS (not PKCS#1 v1.5)?**
- PSS (Probabilistic Signature Scheme) is more secure
- Resistant to known padding attacks
- Same message signed twice produces different signatures (added randomness)

**Key details:**
- Key size: 2048 bits
- Private key: Signs data (kept secret on server)
- Public key: Verifies signatures (can be shared)

**Code location:** `backend/crypto/rsa.py`

```mermaid
flowchart TB
    subgraph "Signing (Server)"
        A[Data Hash] --> B[RSA Private Key]
        B --> C[Signature]
    end
    
    subgraph "Verification (Anyone)"
        C --> D[RSA Public Key]
        A --> D
        D --> E{Signature Valid?}
        E -->|Yes| F[Data is authentic]
        E -->|No| G[Data was forged!]
    end
```

---

### 5. Base64 (Encoding)

**What it does:** Converts binary data to text for storage/transport.

**Why Base64?**
- SQLite and JSON handle text better than raw binary
- Safe for HTTP transmission
- Reversible (not encryption, just encoding)

**Code location:** `backend/crypto/encoding.py`

```mermaid
flowchart LR
    A["Binary: 0x48 0x65 0x6C 0x6C 0x6F"] --> B[Base64 Encode]
    B --> C["Text: 'SGVsbG8='"]
    C --> D[Store in Database]
    D --> E[Base64 Decode]
    E --> F["Binary: 0x48 0x65 0x6C 0x6C 0x6F"]
```

---

## Vault Data Flow (Passwords, Files, Notes)

All vault items (passwords, files, notes) use the **same encryption process**:

| Item Type | Data Stored |
|-----------|-------------|
| Password | JSON: `{"website", "username", "password"}` |
| Note | JSON: `{"title", "content"}` |
| File | Raw binary content |

### Storing Data

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Crypto
    participant Database
    
    User->>Frontend: Submit data (password/file/note)
    Frontend->>Backend: POST /vault/{type}
    Backend->>Crypto: Generate AES key (32 bytes)
    Backend->>Crypto: Generate IV (12 bytes)
    Backend->>Crypto: Encrypt with AES-256-GCM
    Backend->>Crypto: Compute SHA-256 hash
    Backend->>Crypto: Sign hash with RSA private key
    Backend->>Crypto: Base64 encode all binary data
    Backend->>Database: Store encrypted data + key + iv + hash + signature
    Backend-->>Frontend: Success
```

### Retrieving Data

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Crypto
    participant Database
    
    User->>Frontend: Request data
    Frontend->>Backend: GET /vault/{type} (with JWT)
    Backend->>Backend: Verify JWT token
    Backend->>Database: Fetch user's encrypted items
    Database-->>Backend: Encrypted data
    Backend->>Crypto: Base64 decode
    Backend->>Crypto: Decrypt with AES-256-GCM
    Backend->>Crypto: Verify hash + signature
    Backend-->>Frontend: Decrypted data
```

---

## Authentication Flow

### Registration

```mermaid
sequenceDiagram
    participant User
    participant Backend
    participant Database
    
    User->>Backend: POST /auth/register (username + password)
    Backend->>Backend: Hash password with bcrypt
    Backend->>Database: Store user with hashed password
    Backend-->>User: Registration successful
```

### Login + OTP Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Backend
    participant Database
    
    Note over User,Database: Step 1 - Login
    User->>Backend: POST /auth/login (username + password)
    Backend->>Database: Fetch user
    Backend->>Backend: Verify password with bcrypt
    Backend->>Backend: Generate 6-digit OTP
    Backend->>Database: Store OTP + timestamp in user record
    Backend-->>Browser: "OTP required"
    Browser->>Browser: Store username in React state
    Browser->>Browser: Redirect to /verify-otp page
    
    Note over User,Database: Step 2 - Waiting Period
    Note over Browser: Username in browser memory
    Note over Database: OTP in users.otp_secret
    User->>User: Views OTP in backend console
    
    Note over User,Database: Step 3 - OTP Verification
    User->>Backend: POST /auth/verify-otp (username + OTP)
    Backend->>Database: Fetch stored OTP
    Backend->>Backend: Check OTP matches
    Backend->>Backend: Check within 5 minutes
    Backend->>Database: Clear OTP (one-time use)
    Backend->>Backend: Generate JWT token
    Backend-->>Browser: JWT token
    Browser->>Browser: Store JWT in localStorage
```

**Where data is stored during OTP wait:**

| Data | Location | Duration |
|------|----------|----------|
| Username | Browser memory (React state) | Until OTP verified |
| OTP code | Database `users.otp_secret` | 5 minutes max |
| OTP timestamp | Database `users.otp_created_at` | Until next login |

---

## Why This Architecture is Secure

| Threat | Protection |
|--------|------------|
| Password database theft | bcrypt makes passwords uncrackable |
| Vault data theft | AES-256 encryption - data is unreadable |
| Data tampering | SHA-256 + RSA signature detects changes |
| Unauthorized access | JWT + RBAC - users see only their data |
| Session hijacking | JWT expiration limits window |
| Brute force login | OTP adds second factor |
| Replay attacks | Unique IV per encryption |

---

## Key Storage Summary

| Key Type | Location | Purpose |
|----------|----------|---------|
| User password hash | `users.hashed_password` | Login verification |
| AES encryption key | `vault_items.encryption_key` | Data encryption (per item) |
| AES IV | `vault_items.iv` | Encryption randomization |
| RSA private key | `backend/keys/private_key.pem` | Signing |
| RSA public key | `backend/keys/public_key.pem` | Signature verification |
| JWT secret | `backend/auth/jwt.py` | Token signing |
