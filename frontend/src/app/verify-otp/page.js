'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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
        <div className="auth-container">
            <div className="card auth-card card-glass">
                <div className="auth-header">
                    <h1 className="auth-title">Verify Your Account</h1>
                    <p className="auth-subtitle">
                        Enter the 6-digit code to activate your account
                    </p>
                </div>

                <div className="alert alert-info">
                    <strong>Demo Mode:</strong> Check the backend console for your OTP code.
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="otp">One-Time Password</label>
                        <input
                            id="otp"
                            type="text"
                            className="form-input"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            required
                            style={{
                                textAlign: 'center',
                                letterSpacing: '0.5rem',
                                fontSize: '1.5rem',
                                fontFamily: 'monospace'
                            }}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || otp.length !== 6}>
                        {loading ? <span className="spinner"></span> : 'Verify & Activate'}
                    </button>
                </form>

                <p className="text-center mt-lg text-muted">
                    Activating account for <strong>{pendingUsername}</strong>
                </p>
            </div>
        </div>
    );
}
