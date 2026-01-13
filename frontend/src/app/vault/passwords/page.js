'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { vaultAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import PasswordGenerator from '@/components/PasswordGenerator';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';

export default function PasswordsPage() {
    const { loading, isAuthenticated } = useAuth();
    const [passwords, setPasswords] = useState([]);
    const [filteredPasswords, setFilteredPasswords] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showGenerator, setShowGenerator] = useState(false);
    const [formData, setFormData] = useState({ name: '', website: '', username: '', password: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [visiblePasswords, setVisiblePasswords] = useState({});
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchPasswords();
        }
    }, [isAuthenticated]);

    const fetchPasswords = async () => {
        try {
            const response = await vaultAPI.getPasswords();
            setPasswords(response.data);
            setFilteredPasswords(response.data);
        } catch (error) {
            console.error('Failed to fetch passwords:', error);
        }
    };

    // Search filter
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredPasswords(passwords);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredPasswords(
                passwords.filter(pwd =>
                    pwd.name.toLowerCase().includes(query) ||
                    (pwd.website && pwd.website.toLowerCase().includes(query)) ||
                    pwd.username.toLowerCase().includes(query)
                )
            );
        }
    }, [searchQuery, passwords]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            await vaultAPI.storePassword(
                formData.name,
                formData.website,
                formData.username,
                formData.password
            );
            setShowModal(false);
            setShowGenerator(false);
            setFormData({ name: '', website: '', username: '', password: '' });
            fetchPasswords();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save password');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this password?')) return;

        try {
            await vaultAPI.deletePassword(id);
            fetchPasswords();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const togglePasswordVisibility = (id) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleGeneratedPassword = (password) => {
        setFormData({ ...formData, password });
        setShowGenerator(false);
    };

    if (loading || !isAuthenticated) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh' }}>
                <span className="spinner" style={{ width: 40, height: 40 }}></span>
            </div>
        );
    }

    return (
        <div>
            <Navbar />

            <main className="container dashboard">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">Password Vault</h1>
                        <p className="text-muted">Securely stored with AES-256 encryption</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + Add Password
                    </button>
                </div>

                {/* Search Bar */}
                <div className="card" style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md)' }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="🔍 Search passwords by name, website, or username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ marginBottom: 0 }}
                    />
                </div>

                {filteredPasswords.length === 0 ? (
                    <div className="card text-center" style={{ padding: 'var(--space-2xl)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🔐</div>
                        <h3>{passwords.length === 0 ? 'No passwords stored yet' : 'No matching passwords'}</h3>
                        <p className="text-muted mt-sm">
                            {passwords.length === 0
                                ? 'Click "Add Password" to store your first credential securely.'
                                : 'Try a different search term'}
                        </p>
                    </div>
                ) : (
                    <div className="vault-list">
                        {filteredPasswords.map(pwd => (
                            <div key={pwd.id} className="vault-item">
                                <div className="vault-item-info">
                                    <div className="vault-item-icon">🔑</div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div className="vault-item-name">{pwd.name}</div>
                                        <div className="vault-item-meta">
                                            {pwd.website && <span>{pwd.website} • </span>}
                                            {pwd.username}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                                    <div className="password-field">
                                        <code className="password-value">
                                            {visiblePasswords[pwd.id] ? pwd.password : '••••••••'}
                                        </code>
                                        <button
                                            className="password-toggle"
                                            onClick={() => togglePasswordVisibility(pwd.id)}
                                            title={visiblePasswords[pwd.id] ? 'Hide' : 'Show'}
                                        >
                                            {visiblePasswords[pwd.id] ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                    </div>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => handleDelete(pwd.id)}
                                        style={{ padding: '0.4rem 0.8rem' }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Add Password Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => { setShowModal(false); setShowGenerator(false); }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Add Password</h2>
                            <button className="modal-close" onClick={() => { setShowModal(false); setShowGenerator(false); }}>&times;</button>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Label / Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Gmail, Netflix"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Website (optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    placeholder="e.g., gmail.com"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Username / Email</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="Your username or email"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                        onClick={() => setShowGenerator(!showGenerator)}
                                    >
                                        {showGenerator ? '✕ Close Generator' : '🎲 Generate'}
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Your password"
                                    required
                                    style={{ marginTop: '0.5rem' }}
                                />
                                <PasswordStrengthMeter password={formData.password} />
                            </div>

                            {showGenerator && (
                                <div style={{ marginBottom: 'var(--space-lg)' }}>
                                    <PasswordGenerator onSelect={handleGeneratedPassword} />
                                </div>
                            )}

                            <div className="flex gap-md">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setShowGenerator(false); }} style={{ flex: 1 }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
                                    {saving ? <span className="spinner"></span> : 'Save Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
