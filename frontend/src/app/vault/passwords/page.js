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
                // Update existing password
                await vaultAPI.updatePassword(
                    editingPassword.id,
                    formData.name,
                    formData.website,
                    formData.username,
                    formData.password
                );
            } else {
                // Create new password
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
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Password Vault</h1>
                        <p className="text-muted-foreground">Securely stored with AES-256 encryption</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Add Password
                    </button>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        className="w-full bg-card border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                        placeholder="Search passwords by name, website, or username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {filteredPasswords.length === 0 ? (
                    <div className="text-center py-20 bg-card/30 rounded-2xl border border-white/5 border-dashed">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary mb-6">
                            <Key className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">
                            {passwords.length === 0 ? 'No passwords stored yet' : 'No matching passwords'}
                        </h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                            {passwords.length === 0
                                ? 'Your vault is empty. Add your first password to keep it secure.'
                                : 'Try adjusting your search terms to find what you looking for.'}
                        </p>
                        {passwords.length === 0 && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="text-primary hover:text-primary/80 font-medium hover:underline"
                            >
                                Add your first password
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4">
                        <AnimatePresence>
                            {filteredPasswords.map((pwd) => (
                                <motion.div
                                    key={pwd.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group bg-card border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-black/20"
                                >
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                                                <Key className="w-6 h-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-lg truncate pr-4">{pwd.name}</h3>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
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

                                        <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0 pl-[4.5rem] md:pl-0">
                                            <div className="flex-1 md:flex-none relative group/pass">
                                                <div className="bg-secondary/50 rounded-lg px-3 py-2 min-w-[140px] font-mono text-sm flex items-center justify-between border border-transparent group-hover/pass:border-white/10 transition-colors">
                                                    <span>
                                                        {visiblePasswords[pwd.id] ? pwd.password : '••••••••••••'}
                                                    </span>
                                                    <div className="flex items-center gap-1 ml-2">
                                                        <button
                                                            onClick={() => copyToClipboard(pwd.password, pwd.id)}
                                                            className="p-1 hover:text-primary transition-colors rounded"
                                                            title="Copy"
                                                        >
                                                            {copiedId === pwd.id ? <span className="text-green-500 text-xs font-bold">✓</span> : <Copy className="w-3.5 h-3.5" />}
                                                        </button>
                                                        <button
                                                            onClick={() => togglePasswordVisibility(pwd.id)}
                                                            className="p-1 hover:text-primary transition-colors rounded"
                                                            title={visiblePasswords[pwd.id] ? 'Hide' : 'Show'}
                                                        >
                                                            {visiblePasswords[pwd.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => openEditModal(pwd)}
                                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(pwd.id)}
                                                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4.5 h-4.5" />
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
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-card z-10">
                                <h2 className="text-xl font-bold">
                                    {editingPassword ? 'Edit Password' : 'Add New Password'}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                {error && (
                                    <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Label / Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-secondary/50 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Netflix, Gmail"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Website (Optional)</label>
                                        <input
                                            type="text"
                                            className="w-full bg-secondary/50 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            placeholder="e.g., netflix.com"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Username / Email</label>
                                        <input
                                            type="text"
                                            className="w-full bg-secondary/50 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            placeholder="user@example.com"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-muted-foreground">Password</label>
                                            <button
                                                type="button"
                                                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                                                onClick={() => setShowGenerator(!showGenerator)}
                                            >
                                                {showGenerator ? 'Close Generator' : 'Suggest Strong Password'}
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            className="w-full bg-secondary/50 border border-white/10 rounded-lg px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
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

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors font-medium"
                                            onClick={closeModal}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                            disabled={saving}
                                        >
                                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingPassword ? 'Update Password' : 'Save Password')}
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
