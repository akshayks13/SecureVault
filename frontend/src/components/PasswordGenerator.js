'use client';

import { useState } from 'react';
import { utilsAPI } from '@/lib/api';

export default function PasswordGenerator({ onSelect }) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [options, setOptions] = useState({
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeDigits: true,
        includeSpecial: true,
        excludeAmbiguous: false
    });
    const [strength, setStrength] = useState(null);

    const generatePassword = async () => {
        setLoading(true);
        try {
            const response = await utilsAPI.generatePassword(options);
            setPassword(response.data.password);
            setStrength(response.data.strength);
            setCopied(false);
        } catch (error) {
            console.error('Failed to generate password:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleUsePassword = () => {
        if (onSelect && password) {
            onSelect(password);
        }
    };

    const getStrengthColor = () => {
        if (!strength) return 'var(--text-muted)';
        switch (strength.level) {
            case 'strong': return 'var(--success)';
            case 'good': return '#10b981';
            case 'fair': return 'var(--warning)';
            default: return 'var(--error)';
        }
    };

    return (
        <div className="password-generator">
            <div className="generator-result">
                <code className="generated-password">
                    {password || 'Click "Generate" to create a password'}
                </code>
                {password && (
                    <div className="generator-actions">
                        <button onClick={copyToClipboard} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }}>
                            {copied ? '✓ Copied' : '📋 Copy'}
                        </button>
                        {onSelect && (
                            <button onClick={handleUsePassword} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem' }}>
                                Use This
                            </button>
                        )}
                    </div>
                )}
            </div>

            {strength && (
                <div className="strength-display">
                    <div className="strength-bar-bg">
                        <div
                            className="strength-bar-fill"
                            style={{ width: `${strength.score}%`, backgroundColor: getStrengthColor() }}
                        />
                    </div>
                    <span style={{ color: getStrengthColor(), textTransform: 'capitalize', fontSize: '0.85rem' }}>
                        {strength.level} ({strength.score}/100)
                    </span>
                </div>
            )}

            <div className="generator-options">
                <div className="option-row">
                    <label>Length: {options.length}</label>
                    <input
                        type="range"
                        min="8"
                        max="64"
                        value={options.length}
                        onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
                        className="range-input"
                    />
                </div>

                <div className="option-checkboxes">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={options.includeUppercase}
                            onChange={(e) => setOptions({ ...options, includeUppercase: e.target.checked })}
                        />
                        A-Z
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={options.includeLowercase}
                            onChange={(e) => setOptions({ ...options, includeLowercase: e.target.checked })}
                        />
                        a-z
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={options.includeDigits}
                            onChange={(e) => setOptions({ ...options, includeDigits: e.target.checked })}
                        />
                        0-9
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={options.includeSpecial}
                            onChange={(e) => setOptions({ ...options, includeSpecial: e.target.checked })}
                        />
                        !@#$
                    </label>
                </div>

                <label className="checkbox-label" style={{ marginTop: '0.5rem' }}>
                    <input
                        type="checkbox"
                        checked={options.excludeAmbiguous}
                        onChange={(e) => setOptions({ ...options, excludeAmbiguous: e.target.checked })}
                    />
                    Exclude ambiguous characters (0O1lI)
                </label>
            </div>

            <button
                onClick={generatePassword}
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', marginTop: '1rem' }}
            >
                {loading ? <span className="spinner"></span> : '🎲 Generate Password'}
            </button>

            <style jsx>{`
                .password-generator {
                    background: var(--surface-secondary);
                    padding: 1rem;
                    border-radius: var(--radius-md);
                }
                .generator-result {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }
                .generated-password {
                    font-family: var(--font-mono);
                    font-size: 1rem;
                    padding: 0.75rem;
                    background: var(--surface);
                    border-radius: var(--radius-sm);
                    word-break: break-all;
                    min-height: 2.5rem;
                }
                .generator-actions {
                    display: flex;
                    gap: 0.5rem;
                }
                .strength-display {
                    margin-bottom: 1rem;
                }
                .strength-bar-bg {
                    height: 4px;
                    background: var(--surface);
                    border-radius: 2px;
                    overflow: hidden;
                    margin-bottom: 0.25rem;
                }
                .strength-bar-fill {
                    height: 100%;
                    transition: width 0.3s ease;
                }
                .generator-options {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .option-row {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .option-row label {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                }
                .range-input {
                    width: 100%;
                    accent-color: var(--primary);
                }
                .option-checkboxes {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }
                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.85rem;
                    cursor: pointer;
                }
                .checkbox-label input {
                    accent-color: var(--primary);
                }
            `}</style>
        </div>
    );
}
