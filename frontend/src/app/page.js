'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <main>
      <Navbar />

      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            Your Digital Vault,<br />
            <span className="gradient-text">Unbreakable.</span>
          </h1>
          <p className="hero-subtitle">
            Store passwords and files with military-grade encryption.
            Multi-factor authentication, digital signatures, and tamper detection
            keep your data secure.
          </p>
          <div className="flex-center gap-md">
            {isAuthenticated ? (
              <Link href="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/register" className="btn btn-primary">
                  Get Started Free
                </Link>
                <Link href="/login" className="btn btn-secondary">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="container" style={{ marginTop: 'var(--space-3xl)' }}>
        <h2 className="text-center mb-xl">Security Features</h2>
        <div className="dashboard-grid">
          <div className="card feature-card">
            <div className="feature-icon">🔐</div>
            <h3>AES-256 Encryption</h3>
            <p className="text-muted">Your files and passwords are encrypted with military-grade AES-256-GCM encryption.</p>
          </div>
          <div className="card feature-card">
            <div className="feature-icon">🔑</div>
            <h3>bcrypt Password Hashing</h3>
            <p className="text-muted">Passwords are hashed with bcrypt and automatic salt generation.</p>
          </div>
          <div className="card feature-card">
            <div className="feature-icon">✍️</div>
            <h3>Digital Signatures</h3>
            <p className="text-muted">RSA-2048 signatures detect any tampering with your stored files.</p>
          </div>
          <div className="card feature-card">
            <div className="feature-icon">📱</div>
            <h3>Multi-Factor Auth</h3>
            <p className="text-muted">OTP verification adds an extra layer of security to your account.</p>
          </div>
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: 'var(--space-3xl) 0', color: 'var(--text-muted)' }}>
        <p>© 2024 SecureVault. Built with security in mind.</p>
      </footer>
    </main>
  );
}
