'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

export default function ProfilePage() {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, router]);

    if (loading) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh' }}>
                <span className="spinner" style={{ width: 40, height: 40 }}></span>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div>
            <Navbar />

            <main className="container dashboard">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">Profile</h1>
                        <p className="text-muted">Manage your account settings</p>
                    </div>
                </div>

                <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="card" style={{ maxWidth: '600px' }}>
                        <h3 style={{ marginBottom: 'var(--space-lg)' }}>Account Information</h3>

                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <div className="form-input" style={{ backgroundColor: 'var(--surface-secondary)', cursor: 'not-allowed' }}>
                                {user?.username}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">User ID</label>
                            <div className="form-input" style={{ backgroundColor: 'var(--surface-secondary)', cursor: 'not-allowed' }}>
                                {user?.id}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <div className="form-input" style={{ backgroundColor: 'var(--surface-secondary)', cursor: 'not-allowed', textTransform: 'capitalize' }}>
                                {user?.role}
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ maxWidth: '600px' }}>
                        <h3 style={{ marginBottom: 'var(--space-lg)' }}>Security Features</h3>

                        <div className="vault-list">
                            <div className="vault-item" style={{ borderRadius: 'var(--radius-md)' }}>
                                <div className="vault-item-info">
                                    <div className="vault-item-icon">🔐</div>
                                    <div>
                                        <div className="vault-item-name">Password Hashing</div>
                                        <div className="vault-item-meta">bcrypt with automatic salt</div>
                                    </div>
                                </div>
                                <span className="badge">Active</span>
                            </div>

                            <div className="vault-item" style={{ borderRadius: 'var(--radius-md)' }}>
                                <div className="vault-item-info">
                                    <div className="vault-item-icon">🔑</div>
                                    <div>
                                        <div className="vault-item-name">Data Encryption</div>
                                        <div className="vault-item-meta">AES-256-GCM</div>
                                    </div>
                                </div>
                                <span className="badge">Active</span>
                            </div>

                            <div className="vault-item" style={{ borderRadius: 'var(--radius-md)' }}>
                                <div className="vault-item-info">
                                    <div className="vault-item-icon">✍️</div>
                                    <div>
                                        <div className="vault-item-name">Digital Signatures</div>
                                        <div className="vault-item-meta">RSA-2048 PSS</div>
                                    </div>
                                </div>
                                <span className="badge">Active</span>
                            </div>

                            <div className="vault-item" style={{ borderRadius: 'var(--radius-md)' }}>
                                <div className="vault-item-info">
                                    <div className="vault-item-icon">🎫</div>
                                    <div>
                                        <div className="vault-item-name">Session Management</div>
                                        <div className="vault-item-meta">JWT with HS256</div>
                                    </div>
                                </div>
                                <span className="badge">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
