'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { utilsAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import {
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    RefreshCw,
    Key,
    Repeat,
    BarChart3,
    Lightbulb,
    ArrowRight,
    Loader2,
    CheckCircle2,
    XCircle,
    AlertTriangle
} from 'lucide-react';

export default function PasswordHealthPage() {
    const { loading: authLoading, isAuthenticated } = useAuth();
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchHealth();
        }
    }, [isAuthenticated]);

    const fetchHealth = async () => {
        try {
            const response = await utilsAPI.getPasswordHealth();
            setHealth(response.data);
        } catch (err) {
            setError('Failed to load password health report');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-emerald-500';
        if (score >= 60) return 'text-yellow-500';
        if (score >= 40) return 'text-orange-500';
        return 'text-destructive';
    };

    const getLevelIcon = (level) => {
        switch (level) {
            case 'excellent': return '🏆';
            case 'good': return '✅';
            case 'fair': return '⚠️';
            default: return '❌';
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-background pb-12">
            <Navbar />

            <main className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Password Health</h1>
                        <p className="text-muted-foreground">Analyze and improve the security of your stored passwords</p>
                    </div>
                    <button
                        onClick={fetchHealth}
                        className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh Report
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                        {error}
                    </div>
                )}

                {health && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Overall Score Card */}
                        <div className="bg-card border border-white/10 rounded-2xl p-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive via-yellow-500 to-emerald-500 opacity-50" />
                            <div className="relative z-10">
                                <div className="text-6xl mb-4">{getLevelIcon(health.overall_level)}</div>
                                <div className={`text-5xl font-bold mb-2 ${getScoreColor(health.overall_score)}`}>
                                    {health.overall_score}/100
                                </div>
                                <div className={`text-xl font-medium capitalize mb-6 opacity-90 ${getScoreColor(health.overall_score)}`}>
                                    {health.overall_level} Security
                                </div>
                                <p className="text-muted-foreground">
                                    Based on an analysis of {health.total_passwords} password{health.total_passwords !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-card border border-white/10 rounded-xl p-5 hover:border-emerald-500/30 transition-colors group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <span className="text-3xl font-bold text-emerald-500">{health.strong_count}</span>
                                </div>
                                <h3 className="font-medium text-muted-foreground">Strong Passwords</h3>
                            </div>

                            <div className="bg-card border border-white/10 rounded-xl p-5 hover:border-yellow-500/30 transition-colors group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500/20 transition-colors">
                                        <ShieldAlert className="w-6 h-6" />
                                    </div>
                                    <span className="text-3xl font-bold text-yellow-500">{health.weak_count}</span>
                                </div>
                                <h3 className="font-medium text-muted-foreground">Weak Passwords</h3>
                            </div>

                            <div className="bg-card border border-white/10 rounded-xl p-5 hover:border-destructive/30 transition-colors group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 rounded-lg bg-destructive/10 text-destructive group-hover:bg-destructive/20 transition-colors">
                                        <ShieldX className="w-6 h-6" />
                                    </div>
                                    <span className="text-3xl font-bold text-destructive">{health.reused_count}</span>
                                </div>
                                <h3 className="font-medium text-muted-foreground">Reused Passwords</h3>
                            </div>

                            <div className="bg-card border border-white/10 rounded-xl p-5 hover:border-primary/30 transition-colors group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                        <Key className="w-6 h-6" />
                                    </div>
                                    <span className="text-3xl font-bold text-foreground">{health.total_passwords}</span>
                                </div>
                                <h3 className="font-medium text-muted-foreground">Total Passwords</h3>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-card border border-white/10 rounded-xl p-6">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-yellow-500" />
                                Recommendations
                            </h3>
                            <ul className="space-y-3">
                                {health.recommendations.map((rec, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground group">
                                        <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0 group-hover:translate-x-1 transition-transform" />
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Weak Passwords */}
                        {health.weak_passwords.length > 0 && (
                            <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
                                <div className="p-4 border-b border-white/10 bg-destructive/5 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-destructive" />
                                    <h3 className="font-bold text-destructive">Action Required: Weak Passwords ({health.weak_passwords.length})</h3>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {health.weak_passwords.map((pwd) => (
                                        <div key={pwd.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-black/30 text-muted-foreground">
                                                    <Key className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{pwd.name}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                                        <span className={getScoreColor(pwd.score)}>Score: {pwd.score}/100</span>
                                                        <span>•</span>
                                                        <span className="capitalize">{pwd.level}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Link
                                                href="/vault/passwords"
                                                className="btn-secondary text-xs px-3 py-1.5 h-auto whitespace-nowrap"
                                            >
                                                Update Password
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reused Passwords */}
                        {health.reused_passwords.length > 0 && (
                            <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
                                <div className="p-4 border-b border-white/10 bg-orange-500/5 flex items-center gap-2">
                                    <Repeat className="w-5 h-5 text-orange-500" />
                                    <h3 className="font-bold text-orange-500">Security Risk: Reused Passwords ({health.reused_passwords.length})</h3>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {health.reused_passwords.map((group, i) => (
                                        <div key={i} className="p-4 hover:bg-white/5 transition-colors">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Password reused {group.count} times</span>
                                                    <span className="text-xs text-muted-foreground bg-black/30 px-2 py-0.5 rounded font-mono">
                                                        "{group.password_preview}"
                                                    </span>
                                                </div>
                                                <div className="text-sm text-muted-foreground pl-4 border-l-2 border-white/10 space-y-1">
                                                    <div className="text-xs uppercase tracking-wider opacity-70 mb-1">Used in:</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {group.items.map((item) => (
                                                            <span key={item.id} className="bg-secondary/50 px-2 py-1 rounded text-xs flex items-center gap-1">
                                                                <Key className="w-3 h-3 text-primary" />
                                                                {item.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Strong Passwords */}
                        {health.strong_passwords.length > 0 && (
                            <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
                                <div className="p-4 border-b border-white/10 bg-emerald-500/5 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    <h3 className="font-bold text-emerald-500">Secure: Strong Passwords ({health.strong_passwords.length})</h3>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {health.strong_passwords.slice(0, 5).map((pwd) => (
                                        <div key={pwd.id} className="p-4 flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                                <ShieldCheck className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{pwd.name}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                                    <span className="text-emerald-500">Score: {pwd.score}/100</span>
                                                    <span>•</span>
                                                    <span className="capitalize">{pwd.level}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {health.strong_passwords.length > 5 && (
                                        <div className="p-4 text-center text-sm text-muted-foreground bg-white/5">
                                            And {health.strong_passwords.length - 5} more strong passwords
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </main>
        </div>
    );
}
