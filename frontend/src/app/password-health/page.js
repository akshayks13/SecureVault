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
    Lightbulb,
    ArrowRight,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Trophy,
    TrendingUp,
    TrendingDown,
    Gauge
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
        if (score >= 80) return 'text-accent-green';
        if (score >= 60) return 'text-accent-yellow';
        if (score >= 40) return 'text-orange-500';
        return 'text-accent-red';
    };

    const getScoreBgColor = (score) => {
        if (score >= 80) return 'bg-accent-green';
        if (score >= 60) return 'bg-accent-yellow';
        if (score >= 40) return 'bg-orange-500';
        return 'bg-accent-red';
    };

    const getLevelIcon = (level) => {
        switch (level) {
            case 'excellent': return <Trophy className="w-8 h-8 text-amber-400" />;
            case 'good': return <TrendingUp className="w-8 h-8 text-accent-green" />;
            case 'fair': return <Gauge className="w-8 h-8 text-accent-yellow" />;
            default: return <TrendingDown className="w-8 h-8 text-accent-red" />;
        }
    };

    const getLevelBadge = (level) => {
        const styles = {
            excellent: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            good: 'bg-accent-green/10 text-accent-green border-accent-green/20',
            fair: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20',
            poor: 'bg-accent-red/10 text-accent-red border-accent-red/20'
        };
        return styles[level] || styles.poor;
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-surface">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-surface pb-12">
            <Navbar />

            <main className="container mx-auto px-4 py-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-content mb-1">Password Health</h1>
                        <p className="text-content-muted text-sm">Analyze and improve the security of your stored passwords</p>
                    </div>
                    <button
                        onClick={fetchHealth}
                        className="btn-secondary"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh Report
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm font-medium">
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
                        <div className="card p-8 relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-full h-1 ${getScoreBgColor(health.overall_score)} opacity-50`} />

                            <div className="flex flex-col md:flex-row items-center gap-8">
                                {/* Score Circle */}
                                <div className="relative">
                                    <svg className="w-36 h-36 -rotate-90">
                                        <circle
                                            cx="72"
                                            cy="72"
                                            r="64"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            className="text-surface-subtle"
                                        />
                                        <circle
                                            cx="72"
                                            cy="72"
                                            r="64"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            strokeDasharray={`${health.overall_score * 4.02} 402`}
                                            className={getScoreColor(health.overall_score)}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className={`text-4xl font-bold ${getScoreColor(health.overall_score)}`}>
                                            {health.overall_score}
                                        </span>
                                        <span className="text-xs text-content-muted">/ 100</span>
                                    </div>
                                </div>

                                {/* Score Details */}
                                <div className="text-center md:text-left flex-1">
                                    <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                                        <div className={`p-2.5 rounded-xl border ${getLevelBadge(health.overall_level)}`}>
                                            {getLevelIcon(health.overall_level)}
                                        </div>
                                        <div>
                                            <h2 className={`text-2xl font-bold capitalize ${getScoreColor(health.overall_score)}`}>
                                                {health.overall_level} Security
                                            </h2>
                                            <p className="text-sm text-content-muted">
                                                Based on {health.total_passwords} password{health.total_passwords !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard
                                icon={<ShieldCheck className="w-5 h-5" />}
                                iconBg="bg-accent-green/10"
                                iconColor="text-accent-green"
                                value={health.strong_count}
                                label="Strong"
                            />
                            <StatCard
                                icon={<ShieldAlert className="w-5 h-5" />}
                                iconBg="bg-accent-yellow/10"
                                iconColor="text-accent-yellow"
                                value={health.weak_count}
                                label="Weak"
                            />
                            <StatCard
                                icon={<Repeat className="w-5 h-5" />}
                                iconBg="bg-accent-red/10"
                                iconColor="text-accent-red"
                                value={health.reused_count}
                                label="Reused"
                            />
                            <StatCard
                                icon={<Key className="w-5 h-5" />}
                                iconBg="bg-accent-blue/10"
                                iconColor="text-accent-blue"
                                value={health.total_passwords}
                                label="Total"
                            />
                        </div>

                        {/* Recommendations */}
                        {health.recommendations?.length > 0 && (
                            <div className="card overflow-hidden">
                                <div className="p-5 border-b border-surface-subtle flex items-center gap-3">
                                    <div className="icon-container bg-amber-500/10 text-amber-500">
                                        <Lightbulb className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-semibold text-content">Recommendations</h3>
                                </div>
                                <div className="divide-y divide-surface-subtle">
                                    {health.recommendations.map((rec, i) => (
                                        <div key={i} className="p-4 flex items-start gap-3 hover:bg-surface-elevated transition-colors group">
                                            <ArrowRight className="w-4 h-4 text-accent-blue mt-0.5 shrink-0 group-hover:translate-x-1 transition-transform" />
                                            <span className="text-sm text-content-muted">{rec}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Weak Passwords */}
                        {health.weak_passwords?.length > 0 && (
                            <div className="card overflow-hidden">
                                <div className="p-5 border-b border-surface-subtle flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="icon-container bg-accent-red/10 text-accent-red">
                                            <AlertTriangle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-content">Weak Passwords</h3>
                                            <p className="text-xs text-content-muted">{health.weak_passwords.length} passwords need attention</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="divide-y divide-surface-subtle">
                                    {health.weak_passwords.map((pwd) => (
                                        <div key={pwd.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-elevated transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center">
                                                    <Key className="w-4 h-4 text-content-subtle" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-content">{pwd.name}</div>
                                                    <div className="text-xs text-content-muted flex items-center gap-2 mt-0.5">
                                                        <span className={getScoreColor(pwd.score)}>Score: {pwd.score}/100</span>
                                                        <span>•</span>
                                                        <span className="capitalize">{pwd.level}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Link
                                                href="/vault/passwords"
                                                className="btn-secondary text-xs px-3 py-1.5"
                                            >
                                                View in Vault
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reused Passwords */}
                        {health.reused_passwords?.length > 0 && (
                            <div className="card overflow-hidden">
                                <div className="p-5 border-b border-surface-subtle flex items-center gap-3">
                                    <div className="icon-container bg-orange-500/10 text-orange-500">
                                        <Repeat className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-content">Reused Passwords</h3>
                                        <p className="text-xs text-content-muted">Using the same password is a security risk</p>
                                    </div>
                                </div>
                                <div className="divide-y divide-surface-subtle">
                                    {health.reused_passwords.map((group, i) => (
                                        <div key={i} className="p-4 hover:bg-surface-elevated transition-colors">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-2">
                                                    <ShieldX className="w-4 h-4 text-orange-500" />
                                                    <span className="font-medium text-content">Password reused {group.count} times</span>
                                                    <span className="text-xs text-content-muted bg-surface-subtle px-2 py-0.5 rounded font-mono">
                                                        "{group.password_preview}"
                                                    </span>
                                                </div>
                                                <div className="text-sm text-content-muted pl-6 border-l-2 border-surface-subtle space-y-2">
                                                    <div className="text-xs uppercase tracking-wider opacity-70">Used in:</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {group.items.map((item) => (
                                                            <span key={item.id} className="bg-surface-subtle px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 border border-surface-border">
                                                                <Key className="w-3 h-3 text-accent-blue" />
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
                        {health.strong_passwords?.length > 0 && (
                            <div className="card overflow-hidden">
                                <div className="p-5 border-b border-surface-subtle flex items-center gap-3">
                                    <div className="icon-container bg-accent-green/10 text-accent-green">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-content">Strong Passwords</h3>
                                        <p className="text-xs text-content-muted">{health.strong_passwords.length} passwords are secure</p>
                                    </div>
                                </div>
                                <div className="divide-y divide-surface-subtle">
                                    {health.strong_passwords.slice(0, 5).map((pwd) => (
                                        <div key={pwd.id} className="p-4 flex items-center gap-3 hover:bg-surface-elevated transition-colors">
                                            <div className="w-10 h-10 rounded-lg bg-accent-green/10 flex items-center justify-center">
                                                <ShieldCheck className="w-4 h-4 text-accent-green" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-content">{pwd.name}</div>
                                                <div className="text-xs text-content-muted flex items-center gap-2 mt-0.5">
                                                    <span className="text-accent-green">Score: {pwd.score}/100</span>
                                                    <span>•</span>
                                                    <span className="capitalize">{pwd.level}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {health.strong_passwords.length > 5 && (
                                        <div className="p-4 text-center text-sm text-content-muted bg-surface-elevated">
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

function StatCard({ icon, iconBg, iconColor, value, label }) {
    return (
        <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>
                    {icon}
                </div>
                <span className={`text-2xl font-bold ${iconColor}`}>{value}</span>
            </div>
            <h3 className="text-sm font-medium text-content-muted">{label}</h3>
        </div>
    );
}
