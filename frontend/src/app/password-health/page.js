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
        if (score >= 80) return 'text-emerald-500';
        if (score >= 60) return 'text-yellow-500';
        if (score >= 40) return 'text-orange-500';
        return 'text-destructive';
    };

    const getScoreBgColor = (score) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-yellow-500';
        if (score >= 40) return 'bg-orange-500';
        return 'bg-destructive';
    };

    const getLevelIcon = (level) => {
        switch (level) {
            case 'excellent': return <Trophy className="w-8 h-8 text-amber-400" />;
            case 'good': return <TrendingUp className="w-8 h-8 text-emerald-500" />;
            case 'fair': return <Gauge className="w-8 h-8 text-yellow-500" />;
            default: return <TrendingDown className="w-8 h-8 text-destructive" />;
        }
    };

    const getLevelBadge = (level) => {
        const styles = {
            excellent: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            good: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            fair: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            poor: 'bg-destructive/10 text-destructive border-destructive/20'
        };
        return styles[level] || styles.poor;
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
                        <div className="bg-card border border-white/10 rounded-2xl p-8 relative overflow-hidden">
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
                                            className="text-white/5"
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
                                        <span className="text-xs text-muted-foreground">/ 100</span>
                                    </div>
                                </div>

                                {/* Score Details */}
                                <div className="text-center md:text-left flex-1">
                                    <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                                        <div className={`p-2.5 rounded-xl ${getLevelBadge(health.overall_level)}`}>
                                            {getLevelIcon(health.overall_level)}
                                        </div>
                                        <div>
                                            <h2 className={`text-2xl font-bold capitalize ${getScoreColor(health.overall_score)}`}>
                                                {health.overall_level} Security
                                            </h2>
                                            <p className="text-sm text-muted-foreground">
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
                                iconBg="bg-emerald-500/10"
                                iconColor="text-emerald-500"
                                value={health.strong_count}
                                label="Strong"
                                borderHover="hover:border-emerald-500/30"
                            />
                            <StatCard
                                icon={<ShieldAlert className="w-5 h-5" />}
                                iconBg="bg-yellow-500/10"
                                iconColor="text-yellow-500"
                                value={health.weak_count}
                                label="Weak"
                                borderHover="hover:border-yellow-500/30"
                            />
                            <StatCard
                                icon={<Repeat className="w-5 h-5" />}
                                iconBg="bg-destructive/10"
                                iconColor="text-destructive"
                                value={health.reused_count}
                                label="Reused"
                                borderHover="hover:border-destructive/30"
                            />
                            <StatCard
                                icon={<Key className="w-5 h-5" />}
                                iconBg="bg-primary/10"
                                iconColor="text-primary"
                                value={health.total_passwords}
                                label="Total"
                                borderHover="hover:border-primary/30"
                            />
                        </div>

                        {/* Recommendations */}
                        {health.recommendations?.length > 0 && (
                            <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
                                <div className="p-5 border-b border-white/10 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                        <Lightbulb className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-semibold text-lg">Recommendations</h3>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {health.recommendations.map((rec, i) => (
                                        <div key={i} className="p-4 flex items-start gap-3 hover:bg-white/5 transition-colors group">
                                            <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0 group-hover:translate-x-1 transition-transform" />
                                            <span className="text-sm text-muted-foreground">{rec}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Weak Passwords */}
                        {health.weak_passwords?.length > 0 && (
                            <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
                                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                                            <AlertTriangle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">Weak Passwords</h3>
                                            <p className="text-xs text-muted-foreground">{health.weak_passwords.length} passwords need attention</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {health.weak_passwords.map((pwd) => (
                                        <div key={pwd.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                                                    <Key className="w-4 h-4 text-muted-foreground" />
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
                                                View in Vault
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reused Passwords */}
                        {health.reused_passwords?.length > 0 && (
                            <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
                                <div className="p-5 border-b border-white/10 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                        <Repeat className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Reused Passwords</h3>
                                        <p className="text-xs text-muted-foreground">Using the same password is a security risk</p>
                                    </div>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {health.reused_passwords.map((group, i) => (
                                        <div key={i} className="p-4 hover:bg-white/5 transition-colors">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-2">
                                                    <ShieldX className="w-4 h-4 text-orange-500" />
                                                    <span className="font-medium">Password reused {group.count} times</span>
                                                    <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded font-mono">
                                                        "{group.password_preview}"
                                                    </span>
                                                </div>
                                                <div className="text-sm text-muted-foreground pl-6 border-l-2 border-white/10 space-y-2">
                                                    <div className="text-xs uppercase tracking-wider opacity-70">Used in:</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {group.items.map((item) => (
                                                            <span key={item.id} className="bg-secondary/50 px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 border border-white/5">
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
                        {health.strong_passwords?.length > 0 && (
                            <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
                                <div className="p-5 border-b border-white/10 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Strong Passwords</h3>
                                        <p className="text-xs text-muted-foreground">{health.strong_passwords.length} passwords are secure</p>
                                    </div>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {health.strong_passwords.slice(0, 5).map((pwd) => (
                                        <div key={pwd.id} className="p-4 flex items-center gap-3 hover:bg-white/5 transition-colors">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
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

function StatCard({ icon, iconBg, iconColor, value, label, borderHover }) {
    return (
        <div className={`bg-card border border-white/10 rounded-xl p-5 transition-colors ${borderHover}`}>
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>
                    {icon}
                </div>
                <span className={`text-2xl font-bold ${iconColor}`}>{value}</span>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
        </div>
    );
}
