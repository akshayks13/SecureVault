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
        <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-green/10 mb-6">
                        <ShieldCheck className="w-8 h-8 text-accent-green" />
                    </div>
                    <h1 className="text-2xl font-semibold text-content mb-2">Verify Your Account</h1>
                    <p className="text-content-muted text-sm">Enter the 6-digit code sent to your device</p>
                </div>

                {/* Demo Mode Notice */}
                <div className="mb-6 p-4 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm">
                    <strong>Demo Mode:</strong> Check the backend console for your OTP code.
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-content-muted mb-2" htmlFor="otp">
                            One-Time Password
                        </label>
                        <input
                            id="otp"
                            type="text"
                            className="input text-center text-2xl tracking-[0.5em] font-mono py-4"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            maxLength={6}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full mt-6"
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

                {/* Footer */}
                <p className="text-center mt-8 text-sm text-content-muted">
                    Activating account for <strong className="text-content">{pendingUsername}</strong>
                </p>
            </motion.div>
        </div>
    );
}
