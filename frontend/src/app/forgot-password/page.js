'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

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
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Forgot Password</h1>
                    <p className="text-muted">Enter your username to receive a reset code</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {message && <div className="alert alert-success">{message}</div>}

                {!codeSent ? (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input
                                type="text"
                                className="form-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? <span className="spinner"></span> : 'Send Reset Code'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center">
                        <p style={{ marginBottom: 'var(--space-lg)' }}>
                            Check the backend console for your reset code.
                        </p>
                        <button onClick={goToReset} className="btn btn-primary" style={{ width: '100%' }}>
                            Enter Reset Code
                        </button>
                    </div>
                )}

                <div className="auth-footer">
                    <p>
                        Remember your password? <Link href="/login">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
