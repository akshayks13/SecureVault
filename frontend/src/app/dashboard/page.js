'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { vaultAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function DashboardPage() {
    const { user, loading, isAuthenticated } = useAuth();
    const [stats, setStats] = useState({ passwords: 0, files: 0 });
    const [recentItems, setRecentItems] = useState([]);
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);

    const fetchData = async () => {
        try {
            const [passwordsRes, filesRes] = await Promise.all([
                vaultAPI.getPasswords(),
                vaultAPI.getFiles()
            ]);

            setStats({
                passwords: passwordsRes.data.length,
                files: filesRes.data.length
            });

            // Combine and sort for recent items
            const allItems = [
                ...passwordsRes.data.map(p => ({ ...p, type: 'password' })),
                ...filesRes.data.map(f => ({ ...f, type: 'file' }))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

            setRecentItems(allItems);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

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
                        <h1 className="dashboard-title">Welcome, {user?.username}!</h1>
                        <p className="text-muted">Your secure digital vault</p>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <Link href="/vault/passwords" className="card stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="stat-icon">🔑</div>
                        <div className="stat-value">{stats.passwords}</div>
                        <div className="stat-label">Stored Passwords</div>
                    </Link>

                    <Link href="/vault/files" className="card stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="stat-icon">📁</div>
                        <div className="stat-value">{stats.files}</div>
                        <div className="stat-label">Encrypted Files</div>
                    </Link>

                    <div className="card stat-card">
                        <div className="stat-icon">🛡️</div>
                        <div className="stat-value">AES-256</div>
                        <div className="stat-label">Encryption Standard</div>
                    </div>

                    <div className="card stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-value">RSA-2048</div>
                        <div className="stat-label">Digital Signatures</div>
                    </div>
                </div>

                <h2 style={{ marginTop: 'var(--space-2xl)', marginBottom: 'var(--space-lg)' }}>Recent Items</h2>

                {recentItems.length === 0 ? (
                    <div className="card text-center" style={{ padding: 'var(--space-2xl)' }}>
                        <p className="text-muted">No items in your vault yet.</p>
                        <div className="flex-center gap-md mt-lg">
                            <Link href="/vault/passwords" className="btn btn-primary">Add Password</Link>
                            <Link href="/vault/files" className="btn btn-secondary">Upload File</Link>
                        </div>
                    </div>
                ) : (
                    <div className="vault-list">
                        {recentItems.map(item => (
                            <div key={`${item.type}-${item.id}`} className="vault-item">
                                <div className="vault-item-info">
                                    <div className="vault-item-icon">
                                        {item.type === 'password' ? '🔑' : '📄'}
                                    </div>
                                    <div>
                                        <div className="vault-item-name">{item.name}</div>
                                        <div className="vault-item-meta">
                                            {item.type === 'password' ? 'Password' : item.file_name} • {new Date(item.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    href={item.type === 'password' ? '/vault/passwords' : '/vault/files'}
                                    className="btn btn-secondary"
                                >
                                    View
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
