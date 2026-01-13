"""
SecureVault - FastAPI Backend
Main application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routes import auth, vault, utils, teams

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="SecureVault API",
    description="Secure digital vault for storing passwords and files with encryption, hashing, and digital signatures.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(vault.router)
app.include_router(utils.router)
app.include_router(teams.router)


@app.get("/")
async def root():
    """Root endpoint - API health check."""
    return {
        "message": "SecureVault API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# Security info endpoint for demonstration
@app.get("/security-info")
async def security_info():
    """
    Information about security implementations.
    Useful for demonstrating concepts during viva.
    """
    return {
        "authentication": {
            "method": "Username + Password + OTP (Multi-Factor)",
            "password_storage": "bcrypt with salt",
            "session": "JWT tokens"
        },
        "authorization": {
            "model": "RBAC (Role-Based Access Control)",
            "enforcement": "Users can only access their own data"
        },
        "encryption": {
            "algorithm": "AES-256-GCM",
            "key_size": "256 bits",
            "mode": "Galois/Counter Mode (authenticated encryption)"
        },
        "hashing": {
            "passwords": "bcrypt with salt",
            "integrity": "SHA-256"
        },
        "digital_signatures": {
            "algorithm": "RSA-2048 with PSS padding",
            "hash": "SHA-256",
            "purpose": "Tamper detection and authenticity verification"
        },
        "encoding": {
            "method": "Base64",
            "usage": "Binary data storage and transmission"
        }
    }
