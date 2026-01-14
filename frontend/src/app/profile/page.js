'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Lock, Key, FileSignature, ShieldCheck, User, Fingerprint } from 'lucide-react';
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

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Profile</h1>
                    <p className="text-muted-foreground">Manage your account settings</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-6 rounded-xl border border-white/10 bg-card shadow-sm"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
                                <User className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold">Account Information</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Username</label>
                                <div className="p-3 rounded-md bg-secondary text-secondary-foreground border border-white/5 opacity-75 cursor-not-allowed">
                                    {user?.username}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                                <div className="p-3 rounded-md bg-secondary text-secondary-foreground border border-white/5 opacity-75 cursor-not-allowed font-mono text-sm">
                                    {user?.id}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Role</label>
                                <div className="p-3 rounded-md bg-secondary text-secondary-foreground border border-white/5 opacity-75 cursor-not-allowed capitalize">
                                    {user?.role}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-6 rounded-xl border border-white/10 bg-card shadow-sm"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-500">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold">Security Features</h3>
                        </div>

                        <div className="space-y-4">
                            <SecurityFeature
                                icon={<Lock className="w-5 h-5 text-emerald-500" />}
                                title="Password Hashing"
                                meta="bcrypt with automatic salt"
                                status="Active"
                            />
                            <SecurityFeature
                                icon={<Key className="w-5 h-5 text-blue-500" />}
                                title="Data Encryption"
                                meta="AES-256-GCM"
                                status="Active"
                            />
                            <SecurityFeature
                                icon={<FileSignature className="w-5 h-5 text-purple-500" />}
                                title="Digital Signatures"
                                meta="RSA-2048 PSS"
                                status="Active"
                            />
                            <SecurityFeature
                                icon={<Fingerprint className="w-5 h-5 text-orange-500" />}
                                title="Session Management"
                                meta="JWT with HS256"
                                status="Active"
                            />
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}

function SecurityFeature({ icon, title, meta, status }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-secondary/50 hover:bg-secondary transition-colors">
            <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-background border border-white/5">
                    {icon}
                </div>
                <div>
                    <div className="font-medium">{title}</div>
                    <div className="text-sm text-muted-foreground">{meta}</div>
                </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {status}
            </span>
        </div>
    );
}
