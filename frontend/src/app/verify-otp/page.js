'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VerifyOTPPage() {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { verifyOTP, pendingUsername } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Redirect if no pending registration
        if (!pendingUsername) {
            router.push('/register');
        }
    }, [pendingUsername, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await verifyOTP(otp);
            router.push('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    if (!pendingUsername) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl -z-10 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-8"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mb-4 border border-emerald-500/20">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Verify Your Account</h1>
                    <p className="text-muted-foreground">
                        Enter the 6-digit code sent to your device
                    </p>
                </div>

                <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                    <strong>Demo Mode:</strong> Check the backend console for your OTP code.
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground" htmlFor="otp">One-Time Password</label>
                        <input
                            id="otp"
                            type="text"
                            className="w-full bg-secondary/50 border border-white/10 rounded-lg py-4 text-center text-2xl tracking-[0.5em] font-mono placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            maxLength={6}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground font-semibold rounded-lg py-3 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-70"
                        disabled={loading || otp.length !== 6}
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Verify & Activate
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center mt-8 text-sm text-muted-foreground">
                    Activating account for <strong className="text-foreground">{pendingUsername}</strong>
                </p>
            </motion.div>
        </div>
    );
}
