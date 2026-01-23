'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Lock, Key, FileSignature, ShieldCheck, User, Fingerprint, Shield } from 'lucide-react';
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
            <div className="flex items-center justify-center min-h-screen bg-surface">
                <div className="w-10 h-10 border-4 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
    };

    return (
        <div className="min-h-screen bg-surface pb-12">
            <Navbar />

            <main className="container mx-auto px-4 py-10">
                {/* Profile Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-8 mb-6"
                >
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-full bg-accent-blue flex items-center justify-center">
                            <span className="text-3xl font-semibold text-content">
                                {getInitials(user?.username)}
                            </span>
                        </div>

                        {/* User Info */}
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-2xl font-semibold text-content mb-2">{user?.username}</h1>
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-accent-green/10 text-accent-green border border-accent-green/20">
                                    <Shield className="w-3.5 h-3.5" />
                                    Account Protected
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-4">
                    {/* Account Details Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card overflow-hidden"
                    >
                        <div className="p-5 border-b border-surface-subtle flex items-center gap-3">
                            <div className="icon-container icon-blue">
                                <User className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-medium text-content">Account Details</h3>
                        </div>

                        <div className="divide-y divide-surface-subtle">
                            <div className="p-4 flex items-center gap-4 hover:bg-surface-elevated transition-colors">
                                <div className="w-10 h-10 rounded-full bg-surface-subtle flex items-center justify-center">
                                    <User className="w-4 h-4 text-content-subtle" />
                                </div>
                                <div>
                                    <div className="text-xs text-content-muted">Username</div>
                                    <div className="font-medium text-content">{user?.username}</div>
                                </div>
                            </div>

                            <div className="p-4 flex items-center gap-4 hover:bg-surface-elevated transition-colors">
                                <div className="w-10 h-10 rounded-full bg-surface-subtle flex items-center justify-center">
                                    <Fingerprint className="w-4 h-4 text-content-subtle" />
                                </div>
                                <div>
                                    <div className="text-xs text-content-muted">User ID</div>
                                    <div className="font-mono text-sm text-content">{user?.id}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Security Features Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card overflow-hidden"
                    >
                        <div className="p-5 border-b border-surface-subtle flex items-center gap-3">
                            <div className="icon-container icon-green">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-medium text-content">Security Features</h3>
                        </div>

                        <div className="divide-y divide-surface-subtle">
                            <SecurityFeature
                                icon={<Lock className="w-4 h-4" />}
                                iconColor="text-accent-green"
                                iconBg="bg-accent-green/10"
                                title="Password Hashing"
                                meta="bcrypt with automatic salt"
                            />
                            <SecurityFeature
                                icon={<Key className="w-4 h-4" />}
                                iconColor="text-accent-blue"
                                iconBg="bg-accent-blue/10"
                                title="Data Encryption"
                                meta="AES-256-GCM"
                            />
                            <SecurityFeature
                                icon={<FileSignature className="w-4 h-4" />}
                                iconColor="text-accent-purple"
                                iconBg="bg-accent-purple/10"
                                title="Digital Signatures"
                                meta="RSA-2048 PSS"
                            />
                            <SecurityFeature
                                icon={<Fingerprint className="w-4 h-4" />}
                                iconColor="text-accent-yellow"
                                iconBg="bg-accent-yellow/10"
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
        <div className="p-4 flex items-center justify-between hover:bg-surface-elevated transition-colors group">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center ${iconColor}`}>
                    {icon}
                </div>
                <div>
                    <div className="font-medium text-content text-sm">{title}</div>
                    <div className="text-xs text-content-subtle">{meta}</div>
                </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-green/10 text-accent-green border border-accent-green/20">
                Active
            </span>
        </div>
    );
}
