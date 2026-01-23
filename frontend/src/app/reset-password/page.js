'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';
import { motion } from 'framer-motion';
import { User, Lock, Key, Loader2, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
    const [username, setUsername] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const storedUsername = sessionStorage.getItem('resetUsername');
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.resetPassword(username, resetToken, newPassword);
            setMessage(response.data.message);
            sessionStorage.removeItem('resetUsername');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-blue/10 mb-6">
                        <Lock className="w-8 h-8 text-accent-blue" />
                    </div>
                    <h1 className="text-2xl font-semibold text-content mb-2">Reset Password</h1>
                    <p className="text-content-muted text-sm">Enter your reset code and new secure password</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 rounded-xl bg-accent-red/10 border border-accent-red/20 flex items-center gap-3"
                    >
                        <AlertCircle className="w-5 h-5 text-accent-red shrink-0" />
                        <p className="text-sm text-accent-red">{error}</p>
                    </motion.div>
                )}

                {/* Success Alert */}
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 rounded-xl bg-accent-green/10 border border-accent-green/20 flex items-center gap-3"
                    >
                        <CheckCircle className="w-5 h-5 text-accent-green shrink-0" />
                        <p className="text-sm text-accent-green">{message}</p>
                    </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-content-muted mb-2" htmlFor="username">
                            Username
                        </label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-subtle" />
                            <input
                                id="username"
                                type="text"
                                className="input pl-12"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-content-muted mb-2" htmlFor="resetToken">
                            Reset Code
                        </label>
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-subtle" />
                            <input
                                id="resetToken"
                                type="text"
                                className="input pl-12 text-center tracking-[0.5em] font-mono text-lg uppercase"
                                value={resetToken}
                                onChange={(e) => setResetToken(e.target.value)}
                                placeholder="CODE"
                                maxLength={6}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-content-muted mb-2" htmlFor="newPassword">
                            New Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-subtle" />
                            <input
                                id="newPassword"
                                type="password"
                                className="input pl-12"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                            />
                        </div>
                        <PasswordStrengthMeter password={newPassword} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-content-muted mb-2" htmlFor="confirmPassword">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-subtle" />
                            <input
                                id="confirmPassword"
                                type="password"
                                className="input pl-12"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full mt-6"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Reset Password
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="text-center mt-8 text-sm text-content-muted space-x-4">
                    <Link href="/forgot-password" className="text-accent-blue hover:text-accent-blue-hover transition-colors">
                        Request new code
                    </Link>
                    <span className="text-surface-border">|</span>
                    <Link href="/login" className="text-accent-blue hover:text-accent-blue-hover transition-colors">
                        Back to Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
