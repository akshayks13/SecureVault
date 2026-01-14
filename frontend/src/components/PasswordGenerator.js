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
        if (!strength) return 'bg-muted';
        switch (strength.level) {
            case 'strong': return 'bg-emerald-500';
            case 'good': return 'bg-green-500';
            case 'fair': return 'bg-yellow-500';
            default: return 'bg-red-500';
        }
    };

    return (
        <div className="bg-secondary/30 rounded-xl p-4 border border-white/5">
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-2 p-3 bg-background rounded-lg border border-white/5 font-mono text-lg break-all min-h-[50px]">
                    <span className="flex-1 opacity-90">
                        {password || <span className="text-muted-foreground text-base font-sans">Click generate to start...</span>}
                    </span>
                    {password && (
                        <div className="flex gap-1 shrink-0 ml-2">
                            <button
                                onClick={copyToClipboard}
                                className="p-2 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground"
                                title="Copy"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    )}
                </div>

                {password && onSelect && (
                    <button
                        onClick={handleUsePassword}
                        className="w-full text-xs font-medium text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 py-1.5 rounded-md transition-colors"
                    >
                        Use this password
                    </button>
                )}
            </div>

            {strength && (
                <div className="mb-5">
                    <div className="h-1.5 w-full bg-background rounded-full overflow-hidden mb-1.5">
                        <div
                            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                            style={{ width: `${strength.score}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="capitalize text-muted-foreground">{strength.level} Strength</span>
                        <span className="font-medium">{strength.score}/100</span>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <label className="text-muted-foreground">Length</label>
                        <span className="font-mono">{options.length}</span>
                    </div>
                    <input
                        type="range"
                        min="8"
                        max="64"
                        value={options.length}
                        onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
                        className="w-full accent-primary h-1.5 bg-background rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                        <input
                            type="checkbox"
                            checked={options.includeUppercase}
                            onChange={(e) => setOptions({ ...options, includeUppercase: e.target.checked })}
                            className="rounded border-white/20 bg-background text-primary focus:ring-primary/50"
                        />
                        <span>ABC</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                        <input
                            type="checkbox"
                            checked={options.includeLowercase}
                            onChange={(e) => setOptions({ ...options, includeLowercase: e.target.checked })}
                            className="rounded border-white/20 bg-background text-primary focus:ring-primary/50"
                        />
                        <span>abc</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                        <input
                            type="checkbox"
                            checked={options.includeDigits}
                            onChange={(e) => setOptions({ ...options, includeDigits: e.target.checked })}
                            className="rounded border-white/20 bg-background text-primary focus:ring-primary/50"
                        />
                        <span>123</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                        <input
                            type="checkbox"
                            checked={options.includeSpecial}
                            onChange={(e) => setOptions({ ...options, includeSpecial: e.target.checked })}
                            className="rounded border-white/20 bg-background text-primary focus:ring-primary/50"
                        />
                        <span>!@#</span>
                    </label>
                </div>

                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors py-1">
                    <input
                        type="checkbox"
                        checked={options.excludeAmbiguous}
                        onChange={(e) => setOptions({ ...options, excludeAmbiguous: e.target.checked })}
                        className="rounded border-white/20 bg-background text-primary focus:ring-primary/50"
                    />
                    <span>Exclude ambiguous characters (0, O, 1, l, I)</span>
                </label>
            </div>

            <button
                onClick={generatePassword}
                disabled={loading}
                className="w-full mt-5 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 border border-white/5 shadow-sm"
            >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Dices className="w-4 h-4" />}
                Generate New Password
            </button>
        </div>
    );
}
