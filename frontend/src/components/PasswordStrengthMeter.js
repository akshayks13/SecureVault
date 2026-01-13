'use client';

import { useState, useEffect } from 'react';

export default function PasswordStrengthMeter({ password, onChange }) {
    const [strength, setStrength] = useState({
        score: 0,
        level: 'weak',
        feedback: []
    });

    useEffect(() => {
        if (!password) {
            setStrength({ score: 0, level: 'weak', feedback: ['Enter a password'] });
            return;
        }

        // Calculate strength locally for instant feedback
        const result = calculateStrength(password);
        setStrength(result);
    }, [password]);

    const calculateStrength = (pwd) => {
        let score = 0;
        const feedback = [];
        const length = pwd.length;

        // Length scoring
        if (length >= 16) score += 30;
        else if (length >= 12) score += 20;
        else if (length >= 8) score += 10;
        else feedback.push('Use at least 8 characters');

        // Character variety
        const hasLower = /[a-z]/.test(pwd);
        const hasUpper = /[A-Z]/.test(pwd);
        const hasDigit = /[0-9]/.test(pwd);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd);

        if (hasLower) score += 10; else feedback.push('Add lowercase letters');
        if (hasUpper) score += 10; else feedback.push('Add uppercase letters');
        if (hasDigit) score += 10; else feedback.push('Add numbers');
        if (hasSpecial) score += 10; else feedback.push('Add special characters');

        // Uniqueness
        const uniqueRatio = new Set(pwd).size / length;
        if (uniqueRatio > 0.8) score += 20;
        else if (uniqueRatio > 0.6) score += 15;
        else if (uniqueRatio > 0.4) score += 10;
        else feedback.push('Avoid repeating characters');

        // Common patterns
        const patterns = ['123', '234', 'abc', 'qwerty', 'password', 'admin'];
        const pwdLower = pwd.toLowerCase();
        for (const pattern of patterns) {
            if (pwdLower.includes(pattern)) {
                score -= 10;
                feedback.push(`Avoid common patterns`);
                break;
            }
        }

        // Extra length bonus
        if (length >= 20) score += 10;

        score = Math.max(0, Math.min(100, score));

        let level = 'weak';
        if (score >= 80) level = 'strong';
        else if (score >= 60) level = 'good';
        else if (score >= 40) level = 'fair';

        if (feedback.length === 0) feedback.push('Password is strong!');

        return { score, level, feedback };
    };

    const getColor = () => {
        switch (strength.level) {
            case 'strong': return 'var(--success)';
            case 'good': return '#10b981';
            case 'fair': return 'var(--warning)';
            default: return 'var(--error)';
        }
    };

    return (
        <div className="password-strength-meter">
            <div className="strength-bar-container">
                <div
                    className="strength-bar"
                    style={{
                        width: `${strength.score}%`,
                        backgroundColor: getColor()
                    }}
                />
            </div>
            <div className="strength-info">
                <span className="strength-level" style={{ color: getColor(), textTransform: 'capitalize' }}>
                    {strength.level}
                </span>
                <span className="strength-score">{strength.score}/100</span>
            </div>
            {strength.feedback.length > 0 && strength.level !== 'strong' && (
                <ul className="strength-feedback">
                    {strength.feedback.slice(0, 2).map((tip, i) => (
                        <li key={i}>{tip}</li>
                    ))}
                </ul>
            )}
            <style jsx>{`
                .password-strength-meter {
                    margin-top: 0.5rem;
                }
                .strength-bar-container {
                    height: 4px;
                    background: var(--surface-secondary);
                    border-radius: 2px;
                    overflow: hidden;
                }
                .strength-bar {
                    height: 100%;
                    transition: width 0.3s ease, background-color 0.3s ease;
                }
                .strength-info {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 0.25rem;
                    font-size: 0.75rem;
                }
                .strength-score {
                    color: var(--text-muted);
                }
                .strength-feedback {
                    margin: 0.5rem 0 0 0;
                    padding-left: 1rem;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
                .strength-feedback li {
                    margin-bottom: 0.125rem;
                }
            `}</style>
        </div>
    );
}
