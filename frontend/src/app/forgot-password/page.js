'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import { User, Loader2, KeyRound, ArrowRight } from 'lucide-react';

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
            // Store username for reset page
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
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-30 animate-pulse" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl opacity-30 animate-pulse delay-1000" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4 p-4">
                                <KeyRound className="w-full h-full" />
                            </div>
                            <h1 className="text-2xl font-bold mb-2">Forgot Password?</h1>
                            <p className="text-muted-foreground">
                                {codeSent ? "Code sent successfully!" : "Enter your username to receive a reset code"}
                            </p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        {message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mb-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium text-center"
                            >
                                {message}
                            </motion.div>
                        )}

                        {!codeSent ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground ml-1">Username</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            className="w-full bg-secondary/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/50"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Enter your username"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Reset Code <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </form>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center space-y-6"
                            >
                                <div className="p-4 rounded-xl bg-secondary/30 border border-white/5 text-sm text-muted-foreground">
                                    <p>Check the backend console for your reset code.</p>
                                </div>
                                <button
                                    onClick={goToReset}
                                    className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    Enter Reset Code <ArrowRight className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                    </div>

                    <div className="p-4 bg-black/20 text-center border-t border-white/5">
                        <p className="text-sm text-muted-foreground">
                            Remember your password?{' '}
                            <Link href="/login" className="text-primary hover:text-primary/80 font-medium hover:underline transition-all">
                                Login here
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
