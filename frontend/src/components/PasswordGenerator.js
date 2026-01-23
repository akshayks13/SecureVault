'use client';

import { useState } from 'react';
import { utilsAPI } from '@/lib/api';
import { Copy, Check, Dices, RefreshCw } from 'lucide-react';

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
        if (!strength) return 'bg-surface-subtle';
        switch (strength.level) {
            case 'strong': return 'bg-accent-green';
            case 'good': return 'bg-green-500';
            case 'fair': return 'bg-accent-yellow';
            default: return 'bg-accent-red';
        }
    };

    return (
        <div className="bg-surface-subtle rounded-xl p-4 border border-surface-border">
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-2 p-3 bg-surface rounded-lg border border-surface-border font-mono text-lg break-all min-h-[50px]">
                    <span className="flex-1 opacity-90 text-content">
                        {password || <span className="text-content-muted text-base font-sans">Click generate to start...</span>}
                    </span>
                    {password && (
                        <div className="flex gap-1 shrink-0 ml-2">
                            <button
                                onClick={copyToClipboard}
                                className="p-2 hover:bg-surface-elevated rounded-md transition-colors text-content-muted hover:text-content"
                                title="Copy"
                            >
                                {copied ? <Check className="w-4 h-4 text-accent-green" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    )}
                </div>

                {password && onSelect && (
                    <button
                        onClick={handleUsePassword}
                        className="w-full text-xs font-medium text-accent-green hover:text-accent-green/80 hover:bg-accent-green/10 py-1.5 rounded-md transition-colors"
                    >
                        Use this password
                    </button>
                )}
            </div>

            {strength && (
                <div className="mb-5">
                    <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden mb-1.5">
                        <div
                            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                            style={{ width: `${strength.score}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="capitalize text-content-muted">{strength.level} Strength</span>
                        <span className="font-medium text-content">{strength.score}/100</span>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <label className="text-content-muted">Length</label>
                        <span className="font-mono text-content">{options.length}</span>
                    </div>
                    <input
                        type="range"
                        min="8"
                        max="64"
                        value={options.length}
                        onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
                        className="w-full accent-accent-blue h-1.5 bg-surface rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-sm text-content-muted cursor-pointer hover:text-content transition-colors">
                        <input
                            type="checkbox"
                            checked={options.includeUppercase}
                            onChange={(e) => setOptions({ ...options, includeUppercase: e.target.checked })}
                            className="rounded border-surface-border bg-surface text-accent-blue focus:ring-accent-blue/50"
                        />
                        <span>ABC</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-content-muted cursor-pointer hover:text-content transition-colors">
                        <input
                            type="checkbox"
                            checked={options.includeLowercase}
                            onChange={(e) => setOptions({ ...options, includeLowercase: e.target.checked })}
                            className="rounded border-surface-border bg-surface text-accent-blue focus:ring-accent-blue/50"
                        />
                        <span>abc</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-content-muted cursor-pointer hover:text-content transition-colors">
                        <input
                            type="checkbox"
                            checked={options.includeDigits}
                            onChange={(e) => setOptions({ ...options, includeDigits: e.target.checked })}
                            className="rounded border-surface-border bg-surface text-accent-blue focus:ring-accent-blue/50"
                        />
                        <span>123</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-content-muted cursor-pointer hover:text-content transition-colors">
                        <input
                            type="checkbox"
                            checked={options.includeSpecial}
                            onChange={(e) => setOptions({ ...options, includeSpecial: e.target.checked })}
                            className="rounded border-surface-border bg-surface text-accent-blue focus:ring-accent-blue/50"
                        />
                        <span>!@#</span>
                    </label>
                </div>

                <label className="flex items-center gap-2 text-xs text-content-muted cursor-pointer hover:text-content transition-colors py-1">
                    <input
                        type="checkbox"
                        checked={options.excludeAmbiguous}
                        onChange={(e) => setOptions({ ...options, excludeAmbiguous: e.target.checked })}
                        className="rounded border-surface-border bg-surface text-accent-blue focus:ring-accent-blue/50"
                    />
                    <span>Exclude ambiguous characters (0, O, 1, l, I)</span>
                </label>
            </div>

            <button
                onClick={generatePassword}
                disabled={loading}
                className="btn-secondary w-full mt-5"
            >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Dices className="w-4 h-4" />}
                Generate New Password
            </button>
        </div>
    );
}
