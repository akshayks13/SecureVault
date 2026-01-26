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

## Complete Data Flow

### Storing a Password

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Crypto
    participant Database
    
    User->>Frontend: Enter password details
    Frontend->>Backend: POST /vault/passwords
    Backend->>Crypto: Generate AES key (32 bytes)
    Backend->>Crypto: Generate IV (12 bytes)
    Backend->>Crypto: Encrypt with AES-256-GCM
    Backend->>Crypto: Compute SHA-256 hash
    Backend->>Crypto: Sign hash with RSA private key
    Backend->>Crypto: Base64 encode all binary data
    Backend->>Database: Store encrypted data + key + iv + hash + signature
    Database-->>Backend: Success
    Backend-->>Frontend: Password stored
    Frontend-->>User: Confirmation
```

### Retrieving a Password

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Crypto
    participant Database
    
    User->>Frontend: Request passwords
    Frontend->>Backend: GET /vault/passwords (with JWT)
    Backend->>Backend: Verify JWT token
    Backend->>Database: Fetch user's encrypted passwords
    Database-->>Backend: Encrypted data
    Backend->>Crypto: Base64 decode
    Backend->>Crypto: Decrypt with AES-256-GCM
    Backend->>Crypto: Compute SHA-256 of decrypted data
    Backend->>Crypto: Verify hash matches stored hash
    Backend->>Crypto: Verify RSA signature
    Backend-->>Frontend: Decrypted passwords
    Frontend-->>User: Display passwords
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    
    Note over User,Database: Registration
    User->>Frontend: Username + Password
    Frontend->>Backend: POST /auth/register
    Backend->>Backend: bcrypt hash password
    Backend->>Database: Store user with hashed password
    
    Note over User,Database: Login
    User->>Frontend: Username + Password
    Frontend->>Backend: POST /auth/login
    Backend->>Database: Fetch user
    Backend->>Backend: bcrypt verify password
    Backend->>Backend: Generate 6-digit OTP
    Backend-->>Frontend: OTP required
    
    Note over User,Database: OTP Verification
    User->>Frontend: Enter OTP
    Frontend->>Backend: POST /auth/verify-otp
    Backend->>Backend: Verify OTP (5 min validity)
    Backend->>Backend: Generate JWT token
    Backend-->>Frontend: JWT token
    Frontend->>Frontend: Store token in localStorage
```

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
