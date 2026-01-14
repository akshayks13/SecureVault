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

        if (hasLower) score += 10; else feedback.push('Add lowercase...');
        if (hasUpper) score += 10; else feedback.push('Add uppercase...');
        if (hasDigit) score += 10; else feedback.push('Add numbers');
        if (hasSpecial) score += 10; else feedback.push('Add symbols');

        // Uniqueness
        const uniqueRatio = new Set(pwd).size / length;
        if (uniqueRatio > 0.8) score += 20;
        else if (uniqueRatio > 0.6) score += 15;
        else if (uniqueRatio > 0.4) score += 10;
        else feedback.push('Avoid repeating chars');

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
            case 'strong': return 'bg-emerald-500';
            case 'good': return 'bg-green-500';
            case 'fair': return 'bg-yellow-500';
            default: return 'bg-red-500';
        }
    };

    return (
        <div className="mt-2 text-xs">
            <div className="flex justify-between items-end mb-1">
                <span className={`capitalize font-medium ${strength.level === 'strong' ? 'text-emerald-500' :
                        strength.level === 'good' ? 'text-green-500' :
                            strength.level === 'fair' ? 'text-yellow-500' :
                                'text-red-500'
                    }`}>
                    {strength.level}
                </span>
                <span className="text-muted-foreground">{strength.score}%</span>
            </div>

            <div className="h-1 w-full bg-secondary rounded-full overflow-hidden mb-2">
                <div
                    className={`h-full transition-all duration-300 ${getColor()}`}
                    style={{ width: `${strength.score}%` }}
                />
            </div>

            {strength.feedback.length > 0 && strength.level !== 'strong' && (
                <div className="space-y-0.5 text-muted-foreground">
                    {strength.feedback.slice(0, 1).map((tip, i) => (
                        <div key={i} className="flex items-center gap-1">
                            <span>• {tip}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
