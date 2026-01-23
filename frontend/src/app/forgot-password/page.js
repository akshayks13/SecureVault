'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import { User, Loader2, KeyRound, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await authAPI.forgotPassword(username);
            setMessage(response.data.message);
            setCodeSent(true);
            sessionStorage.setItem('resetUsername', username);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to send reset code');
        } finally {
            setLoading(false);
        }
    };

    const goToReset = () => {
        router.push('/reset-password');
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-yellow/10 mb-6">
                        <KeyRound className="w-8 h-8 text-accent-yellow" />
                    </div>
                    <h1 className="text-2xl font-semibold text-content mb-2">Forgot Password?</h1>
                    <p className="text-content-muted text-sm">
                        {codeSent ? "Code sent successfully!" : "Enter your username to receive a reset code"}
                    </p>
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

                {!codeSent ? (
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

                        <button
                            type="submit"
                            className="btn-primary w-full mt-6"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Send Reset Code
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center space-y-6"
                    >
                        <div className="p-4 rounded-xl bg-surface-elevated border border-surface-border text-sm text-content-muted">
                            <p>Check the backend console for your reset code.</p>
                        </div>
                        <button
                            onClick={goToReset}
                            className="btn-primary w-full"
                        >
                            Enter Reset Code
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}

                {/* Footer */}
                <p className="text-center mt-8 text-sm text-content-muted">
                    Remember your password?{' '}
                    <Link href="/login" className="text-accent-blue hover:text-accent-blue-hover font-medium transition-colors">
                        Login here
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
