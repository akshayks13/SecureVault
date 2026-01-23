'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { vaultAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import PasswordGenerator from '@/components/PasswordGenerator';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';
import { Search, Plus, Key, Trash2, Eye, EyeOff, X, Copy, Globe, User, Clock, Loader2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [copiedId, setCopiedId] = useState(null);
    const [editingPassword, setEditingPassword] = useState(null);
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
            if (editingPassword) {
                await vaultAPI.updatePassword(
                    editingPassword.id,
                    formData.name,
                    formData.website,
                    formData.username,
                    formData.password
                );
            } else {
                await vaultAPI.storePassword(
                    formData.name,
                    formData.website,
                    formData.username,
                    formData.password
                );
            }
            closeModal();
            fetchPasswords();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save password');
        } finally {
            setSaving(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setShowGenerator(false);
        setFormData({ name: '', website: '', username: '', password: '' });
        setEditingPassword(null);
        setError('');
    };

    const openEditModal = (pwd) => {
        setEditingPassword(pwd);
        setFormData({
            name: pwd.name,
            website: pwd.website || '',
            username: pwd.username,
            password: pwd.password
        });
        setShowModal(true);
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

    const copyToClipboard = async (text, id) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleGeneratedPassword = (password) => {
        setFormData({ ...formData, password });
        setShowGenerator(false);
    };

    if (loading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-surface">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface">
            <Navbar />

            <main className="container mx-auto px-4 py-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-content mb-1">Password Vault</h1>
                        <p className="text-content-muted text-sm">Securely stored with AES-256 encryption</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary"
                    >
                        <Plus className="w-5 h-5" />
                        Add Password
                    </button>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-subtle" />
                    <input
                        type="text"
                        className="input pl-12"
                        placeholder="Search passwords by name, website, or username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {filteredPasswords.length === 0 ? (
                    <div className="card p-16 text-center border-dashed">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-subtle mb-6">
                            <Key className="w-8 h-8 text-content-subtle" />
                        </div>
                        <h3 className="text-lg font-medium text-content mb-2">
                            {passwords.length === 0 ? 'No passwords stored yet' : 'No matching passwords'}
                        </h3>
                        <p className="text-content-muted text-sm max-w-sm mx-auto mb-6">
                            {passwords.length === 0
                                ? 'Your vault is empty. Add your first password to keep it secure.'
                                : 'Try adjusting your search terms to find what you\'re looking for.'}
                        </p>
                        {passwords.length === 0 && (
                            <button onClick={() => setShowModal(true)} className="btn-primary">
                                Add your first password
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {filteredPasswords.map((pwd) => (
                                <motion.div
                                    key={pwd.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="card card-hover p-4 group"
                                >
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="icon-container icon-blue shrink-0">
                                                <Key className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-medium text-content truncate pr-4">{pwd.name}</h3>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-content-subtle mt-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <User className="w-3.5 h-3.5" />
                                                        <span className="truncate max-w-[150px]">{pwd.username}</span>
                                                    </div>
                                                    {pwd.website && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Globe className="w-3.5 h-3.5" />
                                                            <span className="truncate max-w-[150px]">{pwd.website}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{new Date(pwd.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0 pl-14 md:pl-0">
                                            <div className="flex-1 md:flex-none relative">
                                                <div className="bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 min-w-[140px] font-mono text-sm text-content flex items-center justify-between gap-2">
                                                    <span>{visiblePasswords[pwd.id] ? pwd.password : '••••••••••••'}</span>
                                                    <div className="flex items-center gap-0.5">
                                                        <button
                                                            onClick={() => copyToClipboard(pwd.password, pwd.id)}
                                                            className="p-1.5 text-content-subtle hover:text-accent-blue transition-colors rounded"
                                                            title="Copy"
                                                        >
                                                            {copiedId === pwd.id ? <span className="text-accent-green text-xs font-bold">✓</span> : <Copy className="w-3.5 h-3.5" />}
                                                        </button>
                                                        <button
                                                            onClick={() => togglePasswordVisibility(pwd.id)}
                                                            className="p-1.5 text-content-subtle hover:text-accent-blue transition-colors rounded"
                                                            title={visiblePasswords[pwd.id] ? 'Hide' : 'Show'}
                                                        >
                                                            {visiblePasswords[pwd.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => openEditModal(pwd)}
                                                className="p-2.5 text-content-subtle hover:text-accent-blue hover:bg-accent-blue/10 rounded-full transition-all"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(pwd.id)}
                                                className="p-2.5 text-content-subtle hover:text-accent-red hover:bg-accent-red/10 rounded-full transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* Add/Edit Password Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModal}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-surface-elevated border border-surface-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-5 border-b border-surface-border flex items-center justify-between sticky top-0 bg-surface-elevated z-10">
                                <h2 className="text-lg font-semibold text-content">
                                    {editingPassword ? 'Edit Password' : 'Add New Password'}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="p-2 text-content-subtle hover:text-content hover:bg-surface-border rounded-full transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-5 overflow-y-auto custom-scrollbar">
                                {error && (
                                    <div className="mb-5 p-4 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-content-muted mb-2">Label / Name</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Netflix, Gmail"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-content-muted mb-2">Website (Optional)</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            placeholder="e.g., netflix.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-content-muted mb-2">Username / Email</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            placeholder="user@example.com"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm font-medium text-content-muted">Password</label>
                                            <button
                                                type="button"
                                                className="text-xs font-medium text-accent-blue hover:text-accent-blue-hover transition-colors"
                                                onClick={() => setShowGenerator(!showGenerator)}
                                            >
                                                {showGenerator ? 'Close Generator' : 'Generate Password'}
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            className="input font-mono"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Enter password"
                                            required
                                        />
                                        <PasswordStrengthMeter password={formData.password} />
                                    </div>

                                    <AnimatePresence>
                                        {showGenerator && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-2 pb-4">
                                                    <PasswordGenerator onSelect={handleGeneratedPassword} />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            className="btn-secondary flex-1"
                                            onClick={closeModal}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn-primary flex-1"
                                            disabled={saving}
                                        >
                                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingPassword ? 'Update' : 'Save')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
