'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';

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
        // Try to get username from session storage
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
            // Redirect to login after 2 seconds
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
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Reset Password</h1>
                    <p className="text-muted">Enter your reset code and new password</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {message && <div className="alert alert-success">{message}</div>}

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

                    <div className="form-group">
                        <label className="form-label">Reset Code</label>
                        <input
                            type="text"
                            className="form-input"
                            value={resetToken}
                            onChange={(e) => setResetToken(e.target.value)}
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            required
                            style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.25rem' }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                        />
                        <PasswordStrengthMeter password={newPassword} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? <span className="spinner"></span> : 'Reset Password'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        <Link href="/forgot-password">Request new code</Link> | <Link href="/login">Back to Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
