'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { utilsAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function PasswordHealthPage() {
    const { loading: authLoading, isAuthenticated } = useAuth();
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchHealth();
        }
    }, [isAuthenticated]);

    const fetchHealth = async () => {
        try {
            const response = await utilsAPI.getPasswordHealth();
            setHealth(response.data);
        } catch (err) {
            setError('Failed to load password health report');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'var(--success)';
        if (score >= 60) return '#10b981';
        if (score >= 40) return 'var(--warning)';
        return 'var(--error)';
    };

    const getLevelEmoji = (level) => {
        switch (level) {
            case 'excellent': return '🏆';
            case 'good': return '✅';
            case 'fair': return '⚠️';
            default: return '❌';
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh' }}>
                <span className="spinner" style={{ width: 40, height: 40 }}></span>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div>
            <Navbar />

            <main className="container dashboard">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">Password Health Report</h1>
                        <p className="text-muted">Analyze the security of your stored passwords</p>
                    </div>
                    <button className="btn btn-secondary" onClick={fetchHealth}>
                        🔄 Refresh
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {health && (
                    <>
                        {/* Overall Score Card */}
                        <div className="card" style={{ marginBottom: 'var(--space-xl)', textAlign: 'center', padding: 'var(--space-2xl)' }}>
                            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>
                                {getLevelEmoji(health.overall_level)}
                            </div>
                            <div style={{
                                fontSize: '3rem',
                                fontWeight: 'bold',
                                color: getScoreColor(health.overall_score)
                            }}>
                                {health.overall_score}/100
                            </div>
                            <div style={{
                                fontSize: '1.5rem',
                                textTransform: 'capitalize',
                                color: getScoreColor(health.overall_score),
                                marginBottom: 'var(--space-lg)'
                            }}>
                                {health.overall_level}
                            </div>
                            <div className="text-muted">
                                {health.total_passwords} password(s) analyzed
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="dashboard-grid" style={{ marginBottom: 'var(--space-xl)' }}>
                            <div className="card stat-card">
                                <div className="stat-icon">💪</div>
                                <div className="stat-value" style={{ color: 'var(--success)' }}>{health.strong_count}</div>
                                <div className="stat-label">Strong Passwords</div>
                            </div>
                            <div className="card stat-card">
                                <div className="stat-icon">⚠️</div>
                                <div className="stat-value" style={{ color: 'var(--warning)' }}>{health.weak_count}</div>
                                <div className="stat-label">Weak Passwords</div>
                            </div>
                            <div className="card stat-card">
                                <div className="stat-icon">🔄</div>
                                <div className="stat-value" style={{ color: 'var(--error)' }}>{health.reused_count}</div>
                                <div className="stat-label">Reused Passwords</div>
                            </div>
                            <div className="card stat-card">
                                <div className="stat-icon">📊</div>
                                <div className="stat-value">{health.total_passwords}</div>
                                <div className="stat-label">Total Passwords</div>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                            <h3 style={{ marginBottom: 'var(--space-lg)' }}>💡 Recommendations</h3>
                            <ul style={{ paddingLeft: 'var(--space-lg)', lineHeight: 1.8 }}>
                                {health.recommendations.map((rec, i) => (
                                    <li key={i} style={{ marginBottom: 'var(--space-sm)' }}>{rec}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Weak Passwords */}
                        {health.weak_passwords.length > 0 && (
                            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                                <h3 style={{ marginBottom: 'var(--space-lg)', color: 'var(--warning)' }}>
                                    ⚠️ Weak Passwords ({health.weak_passwords.length})
                                </h3>
                                <div className="vault-list">
                                    {health.weak_passwords.map((pwd) => (
                                        <div key={pwd.id} className="vault-item">
                                            <div className="vault-item-info">
                                                <div className="vault-item-icon">🔑</div>
                                                <div>
                                                    <div className="vault-item-name">{pwd.name}</div>
                                                    <div className="vault-item-meta">
                                                        Score: {pwd.score}/100 • {pwd.level}
                                                    </div>
                                                </div>
                                            </div>
                                            <Link href="/vault/passwords" className="btn btn-warning" style={{ padding: '0.4rem 0.8rem' }}>
                                                Update
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reused Passwords */}
                        {health.reused_passwords.length > 0 && (
                            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                                <h3 style={{ marginBottom: 'var(--space-lg)', color: 'var(--error)' }}>
                                    🔄 Reused Passwords ({health.reused_passwords.length})
                                </h3>
                                <div className="vault-list">
                                    {health.reused_passwords.map((group, i) => (
                                        <div key={i} className="vault-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div className="vault-item-info">
                                                    <div className="vault-item-icon">⚠️</div>
                                                    <div>
                                                        <div className="vault-item-name">
                                                            Password "{group.password_preview}" used {group.count} times
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: 'var(--space-sm)', paddingLeft: 'var(--space-2xl)' }}>
                                                <span className="text-muted">Used in: </span>
                                                {group.items.map((item, j) => (
                                                    <span key={item.id}>
                                                        {item.name}{j < group.items.length - 1 ? ', ' : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Strong Passwords */}
                        {health.strong_passwords.length > 0 && (
                            <div className="card">
                                <h3 style={{ marginBottom: 'var(--space-lg)', color: 'var(--success)' }}>
                                    💪 Strong Passwords ({health.strong_passwords.length})
                                </h3>
                                <div className="vault-list">
                                    {health.strong_passwords.slice(0, 5).map((pwd) => (
                                        <div key={pwd.id} className="vault-item">
                                            <div className="vault-item-info">
                                                <div className="vault-item-icon">✅</div>
                                                <div>
                                                    <div className="vault-item-name">{pwd.name}</div>
                                                    <div className="vault-item-meta">
                                                        Score: {pwd.score}/100 • {pwd.level}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {health.strong_passwords.length > 5 && (
                                        <div className="text-muted text-center" style={{ padding: 'var(--space-md)' }}>
                                            And {health.strong_passwords.length - 5} more...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
