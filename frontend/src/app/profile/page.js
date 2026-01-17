'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Lock, Key, FileSignature, ShieldCheck, User, Fingerprint, Mail, Calendar, Shield, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    // Generate initials from username
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
    };

    // Generate a consistent gradient based on username
    const getGradientClass = (name) => {
        const gradients = [
            'from-blue-500 to-indigo-600',
            'from-purple-500 to-pink-600',
            'from-emerald-500 to-teal-600',
            'from-orange-500 to-red-600',
            'from-cyan-500 to-blue-600',
        ];
        const index = name ? name.charCodeAt(0) % gradients.length : 0;
        return gradients[index];
    };

    return (
        <div className="min-h-screen bg-background pb-12">
            <Navbar />

            <main className="container mx-auto px-4 py-8">
                {/* Profile Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-white/10 rounded-2xl p-8 mb-8 relative overflow-hidden"
                >
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary/20 via-blue-500/20 to-indigo-500/20 opacity-50" />
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-card" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${getGradientClass(user?.username)} flex items-center justify-center shadow-2xl shadow-primary/30 ring-4 ring-card`}>
                            <span className="text-4xl font-bold text-white">
                                {getInitials(user?.username)}
                            </span>
                        </div>

                        {/* User Info */}
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-3xl font-bold mb-1">{user?.username}</h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-muted-foreground">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${user?.role === 'admin'
                                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                        : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                    }`}>
                                    {user?.role === 'admin' ? <Award className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                                </span>
                                <span className="text-sm flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                                    Account Protected
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Account Details Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card border border-white/10 rounded-xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/10 flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                                <User className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold">Account Details</h3>
                        </div>

                        <div className="divide-y divide-white/5">
                            <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Username</div>
                                        <div className="font-medium">{user?.username}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                                        <Fingerprint className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">User ID</div>
                                        <div className="font-mono text-sm">{user?.id}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                                        <Shield className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Role</div>
                                        <div className="font-medium capitalize">{user?.role}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Security Features Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card border border-white/10 rounded-xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/10 flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold">Security Features</h3>
                        </div>

                        <div className="divide-y divide-white/5">
                            <SecurityFeature
                                icon={<Lock className="w-4 h-4" />}
                                iconColor="text-emerald-500"
                                iconBg="bg-emerald-500/10"
                                title="Password Hashing"
                                meta="bcrypt with automatic salt"
                            />
                            <SecurityFeature
                                icon={<Key className="w-4 h-4" />}
                                iconColor="text-blue-500"
                                iconBg="bg-blue-500/10"
                                title="Data Encryption"
                                meta="AES-256-GCM"
                            />
                            <SecurityFeature
                                icon={<FileSignature className="w-4 h-4" />}
                                iconColor="text-purple-500"
                                iconBg="bg-purple-500/10"
                                title="Digital Signatures"
                                meta="RSA-2048 PSS"
                            />
                            <SecurityFeature
                                icon={<Fingerprint className="w-4 h-4" />}
                                iconColor="text-orange-500"
                                iconBg="bg-orange-500/10"
                                title="Session Management"
                                meta="JWT with HS256"
                            />
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}

function SecurityFeature({ icon, iconColor, iconBg, title, meta }) {
    return (
        <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}>
                    {icon}
                </div>
                <div>
                    <div className="font-medium">{title}</div>
                    <div className="text-sm text-muted-foreground">{meta}</div>
                </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Active
            </span>
        </div>
    );
}
