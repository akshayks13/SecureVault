# SecureVault - Evaluation Rubric Mapping

This document explains how SecureVault implements each required security component.

---

## 1. Authentication (3 marks)

### 1.1 Single-Factor Authentication (1.5 marks)

**Implementation:** Username + Password login

```
User → Username + Password → Backend → bcrypt verify → Success/Fail
```

**Code Location:** `backend/routes/auth.py` → `login()` function

**How it works:**
1. User enters username and password
2. Backend fetches user from database
3. Password verified using bcrypt: `bcrypt.checkpw(input_password, stored_hash)`
4. If match → proceed to MFA

---

### 1.2 Multi-Factor Authentication (1.5 marks)

**Implementation:** Password + OTP (Two factors)

| Factor | Type | Implementation |
|--------|------|----------------|
| Factor 1 | Something you know | Password |
| Factor 2 | Something you have | OTP sent to device |

```
Password Verified → Generate 6-digit OTP → Store in DB → User enters OTP → Verify → JWT issued
```

**Code Location:** 
- OTP Generation: `backend/routes/auth.py` → `login()` - generates random 6-digit code
- OTP Verification: `backend/routes/auth.py` → `verify_otp()` - checks code + 5-min expiry

**NIST SP 800-63-2 Compliance:**
- OTP expires after 5 minutes (replay attack prevention)
- OTP is one-time use (cleared after verification)
- OTP stored server-side, not in token

---

## 2. Authorization - Access Control (3 marks)

### 2.1 Access Control Model (ACL)

**Subjects (Users):** 3+ types
| Subject | Description |
|---------|-------------|
| Regular User | Standard vault access |
| Admin User | Full system access |
| Team Member | Access to shared team files |

**Objects:** 3+ types
| Object | Description |
|--------|-------------|
| Vault Items | Passwords, Files, Notes |
| Team Resources | Shared files within team |
| Admin Resources | User management, logs |

**Access Control Matrix:**

| Subject | Own Vault Items | Other's Vault Items | Team Shared Files | Admin Panel |
|---------|-----------------|---------------------|-------------------|-------------|
| User | CRUD | ❌ None | Read (if member) | ❌ None |
| Admin | CRUD | Read | Read/Write | Full Access |
| Team Owner | CRUD | ❌ None | Full Control | ❌ None |
| Team Member | CRUD | ❌ None | Read Only | ❌ None |

---

### 2.2 Policy Definition & Justification (1.5 marks)

| Policy | Rule | Justification |
|--------|------|---------------|
| Data Isolation | Users can ONLY access their own vault items | Privacy - prevent data leakage between users |
| Role-Based Access | Admin role has elevated privileges | Separation of duties for system management |
| Team Hierarchy | Owner > Admin > Member | Principle of least privilege for collaboration |
| Authentication Required | All vault operations require valid JWT | Prevent unauthorized access |

---

### 2.3 Implementation of Access Control (1.5 marks)

**Code Location:** `backend/routes/vault.py`

**Enforcement Method:** Every database query filters by `user_id`

```python
# Example from list_passwords()
items = db.query(VaultItem).filter(
    VaultItem.user_id == current_user.id,  # ← RBAC enforcement
    VaultItem.type == "password"
).all()
```

**Team RBAC:** `backend/routes/teams.py`
```python
# Check if user has permission
member = db.query(TeamMember).filter(
    TeamMember.team_id == team_id,
    TeamMember.user_id == current_user.id
).first()

if member.role not in ["OWNER", "ADMIN"]:
    raise HTTPException(403, "Permission denied")
```

---

## 3. Encryption (3 marks)

### 3.1 Key Exchange / Generation Mechanism (1.5 marks)

**Implementation:** Random key generation per vault item

**Code Location:** `backend/crypto/aes.py`

```python
def generate_aes_key() -> bytes:
    return os.urandom(32)  # 256-bit cryptographically secure random key

def generate_iv() -> bytes:
    return os.urandom(12)  # 96-bit IV for AES-GCM
```

**Key Properties:**
- 256-bit AES key (military-grade)
- Generated using OS cryptographic random source
- Unique key per item (limits breach impact)
- IV ensures same plaintext → different ciphertext

---

### 3.2 Encryption & Decryption (1.5 marks)

**Algorithm:** AES-256-GCM (Galois/Counter Mode)

**Code Location:** `backend/crypto/aes.py`

```python
# Encryption
def encrypt_data(data: bytes, key: bytes, iv: bytes) -> bytes:
    aesgcm = AESGCM(key)
    return aesgcm.encrypt(iv, data, None)

# Decryption
def decrypt_data(encrypted_data: bytes, key: bytes, iv: bytes) -> bytes:
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(iv, encrypted_data, None)
```

**Why AES-GCM:**
- Authenticated encryption (confidentiality + integrity)
- Tamper detection built-in (auth tag)
- Industry standard, NIST approved

**What gets encrypted:**
| Data Type | Encrypted Content |
|-----------|-------------------|
| Passwords | `{"website", "username", "password"}` |
| Notes | `{"title", "content"}` |
| Files | Raw binary content |

---

## 4. Hashing & Digital Signature (3 marks)

### 4.1 Hashing with Salt (1.5 marks)

**Algorithm:** bcrypt with automatic salt

**Code Location:** `backend/crypto/password.py`

```python
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()  # Random 128-bit salt
    hashed = bcrypt.hashpw(password.encode(), salt)
    return hashed.decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())
```

**Why bcrypt with salt:**
- Salt prevents rainbow table attacks
- bcrypt is intentionally slow (prevents brute force)
- Salt is embedded in hash output (no separate storage needed)

**bcrypt output format:** `$2b$12$[22-char salt][31-char hash]`

---

### 4.2 Digital Signature using Hash (1.5 marks)

**Implementation:** SHA-256 hash + RSA-2048 PSS signature

**Code Locations:**
- Hash: `backend/crypto/hashing.py`
- Signature: `backend/crypto/rsa.py`

**Process:**
```
Original Data → SHA-256 Hash → RSA Sign with Private Key → Signature
```

```python
# Hashing (hashing.py)
def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

# Signing (rsa.py)
def sign_data(data: bytes) -> bytes:
    private_key = load_private_key()
    signature = private_key.sign(
        data,
        padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
        hashes.SHA256()
    )
    return signature
```

**Verification Process:**
```python
def verify_signature(data: bytes, signature: bytes) -> bool:
    public_key = load_public_key()
    public_key.verify(signature, data, padding.PSS(...), hashes.SHA256())
    return True  # Raises exception if invalid
```

**Purpose:**
- SHA-256: Ensures data integrity (detects modifications)
- RSA Signature: Proves data originated from server (authenticity)

---

## 5. Encoding Techniques (3 marks)

### 5.1 Encoding & Decoding Implementation (1 mark)

**Technique:** Base64 Encoding

**Code Location:** `backend/crypto/encoding.py`

```python
import base64

def encode_base64(data: bytes) -> str:
    return base64.b64encode(data).decode('utf-8')

def decode_base64(encoded: str) -> bytes:
    return base64.b64decode(encoded.encode('utf-8'))
```

**Where it's used:**
| Data | Why Base64 |
|------|------------|
| Encrypted vault data | SQLite stores TEXT better than binary |
| AES keys | Safe for JSON transmission |
| IVs and signatures | Database compatibility |

---

### 5.2 Security Levels & Risks (1 mark)

| Security Level | Implementation | Risk if Missing |
|----------------|----------------|-----------------|
| Transport | HTTPS (production) | Man-in-the-middle attacks |
| Storage | AES-256 encryption | Data breach exposure |
| Authentication | bcrypt + OTP | Unauthorized access |
| Integrity | SHA-256 + RSA | Data tampering |
| Access Control | RBAC | Privilege escalation |

**Risk Assessment:**
| Component | Security Level | Justification |
|-----------|----------------|---------------|
| Login passwords | High | bcrypt with 12 rounds |
| Vault data | High | AES-256-GCM encryption |
| Session tokens | Medium | JWT with expiration |
| OTP | Medium | 5-minute expiry, one-time use |

---

### 5.3 Possible Attacks (1 mark)

| Attack | Protection in SecureVault |
|--------|---------------------------|
| **Brute Force** | bcrypt slow hashing + OTP requirement |
| **Rainbow Table** | bcrypt automatic salting |
| **SQL Injection** | SQLAlchemy ORM parameterized queries |
| **Data Breach** | AES-256 encryption (data useless without keys) |
| **Tampering** | SHA-256 hash + RSA signature verification |
| **Session Hijacking** | JWT expiration (24 hours) |
| **Replay Attack** | One-time OTP, unique IV per encryption |
| **Privilege Escalation** | RBAC with user_id filtering |
| **Man-in-the-Middle** | HTTPS in production |

---

## 6. NIST SP 800-63-2 Compliance

**E-Authentication Architecture Model:**

| NIST Requirement | SecureVault Implementation |
|------------------|---------------------------|
| Identity Proofing | Username registration with unique constraint |
| Credential Management | bcrypt hashed passwords, no plaintext storage |
| Token Assertion | JWT tokens with claims (user_id, expiration) |
| Multi-Factor | Password (knowledge) + OTP (possession) |
| Session Management | JWT expiration, localStorage storage |
| Credential Revocation | Password reset with expiring tokens |

---

## Summary Table

| Component | Marks | Implementation | Code Location |
|-----------|-------|----------------|---------------|
| Single-Factor Auth | 1.5 | Username + bcrypt password | `auth.py` |
| Multi-Factor Auth | 1.5 | Password + OTP | `auth.py` |
| Access Control Model | 1.5 | ACL with 3+ subjects/objects | `vault.py`, `teams.py` |
| Access Control Implementation | 1.5 | RBAC with user_id filtering | All routes |
| Key Generation | 1.5 | `os.urandom()` per item | `aes.py` |
| Encryption/Decryption | 1.5 | AES-256-GCM | `aes.py` |
| Hashing with Salt | 1.5 | bcrypt with auto-salt | `password.py` |
| Digital Signature | 1.5 | SHA-256 + RSA-PSS | `hashing.py`, `rsa.py` |
| Encoding | 1 | Base64 | `encoding.py` |
| Security Levels | 1 | Documented above | - |
| Possible Attacks | 1 | Documented above | - |
| **Total** | **15** | | |
