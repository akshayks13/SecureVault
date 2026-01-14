'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { vaultAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Key, FolderLock, ShieldCheck, Binary, Loader2, FileText, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
    const { user, loading, isAuthenticated } = useAuth();
    const [stats, setStats] = useState({ passwords: 0, files: 0 });
    const [recentItems, setRecentItems] = useState([]);
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);

    const fetchData = async () => {
        try {
            const [passwordsRes, filesRes] = await Promise.all([
                vaultAPI.getPasswords(),
                vaultAPI.getFiles()
            ]);

            setStats({
                passwords: passwordsRes.data.length,
                files: filesRes.data.length
            });

            // Combine and sort for recent items
            const allItems = [
                ...passwordsRes.data.map(p => ({ ...p, type: 'password' })),
                ...filesRes.data.map(f => ({ ...f, type: 'file' }))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

            setRecentItems(allItems);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Welcome, {user?.username}!</h1>
                    <p className="text-muted-foreground">Your secure digital vault overview</p>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
                >
                    <Link href="/vault/passwords" className="block">
                        <motion.div variants={itemVariants} className="p-6 rounded-xl border border-white/10 bg-card hover:bg-white/5 transition-colors cursor-pointer group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
                                    <Key className="w-6 h-6" />
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                            </div>
                            <div className="text-3xl font-bold mb-1">{stats.passwords}</div>
                            <div className="text-sm text-muted-foreground">Stored Passwords</div>
                        </motion.div>
                    </Link>

                    <Link href="/vault/files" className="block">
                        <motion.div variants={itemVariants} className="p-6 rounded-xl border border-white/10 bg-card hover:bg-white/5 transition-colors cursor-pointer group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-500">
                                    <FolderLock className="w-6 h-6" />
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                            </div>
                            <div className="text-3xl font-bold mb-1">{stats.files}</div>
                            <div className="text-sm text-muted-foreground">Encrypted Files</div>
                        </motion.div>
                    </Link>

                    <motion.div variants={itemVariants} className="p-6 rounded-xl border border-white/10 bg-card/50">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="text-xl font-bold mb-1">AES-256</div>
                        <div className="text-sm text-muted-foreground">Encryption Standard</div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="p-6 rounded-xl border border-white/10 bg-card/50">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500">
                                <Binary className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="text-xl font-bold mb-1">RSA-2048</div>
                        <div className="text-sm text-muted-foreground">Digital Signatures</div>
                    </motion.div>
                </motion.div>

                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    Recent Items
                </h2>

                <div className="space-y-4">
                    {recentItems.length === 0 ? (
                        <div className="p-12 text-center rounded-xl border border-white/10 bg-card/50 border-dashed">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary mb-4">
                                <FolderLock className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Your vault is empty</h3>
                            <p className="text-muted-foreground mb-6">Start by adding passwords or uploading secure files.</p>
                            <div className="flex items-center justify-center gap-4">
                                <Link href="/vault/passwords" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                                    Add Password
                                </Link>
                                <Link href="/vault/files" className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors">
                                    Upload File
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {recentItems.map((item, index) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={`${item.type}-${item.id}`}
                                    className="p-4 rounded-xl border border-white/5 bg-card hover:bg-white/5 transition-colors flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-lg ${item.type === 'password' ? 'bg-blue-500/10 text-blue-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                            {item.type === 'password' ? <Key className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="font-medium group-hover:text-primary transition-colors">{item.name}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                <span className="capitalize">{item.type === 'password' ? 'Password' : item.file_name}</span>
                                                <span>•</span>
                                                <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Link
                                        href={item.type === 'password' ? '/vault/passwords' : '/vault/files'}
                                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        View
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
