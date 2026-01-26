'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { vaultAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Key, FolderLock, Loader2, FileText, ArrowRight, StickyNote, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
    const { user, loading, isAuthenticated } = useAuth();
    const [stats, setStats] = useState({ passwords: 0, files: 0, notes: 0 });
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
            const [passwordsRes, filesRes, notesRes] = await Promise.all([
                vaultAPI.getPasswords(),
                vaultAPI.getFiles(),
                vaultAPI.getNotes()
            ]);

            setStats({
                passwords: passwordsRes.data.length,
                files: filesRes.data.length,
                notes: notesRes.data.length
            });

            const allItems = [
                ...passwordsRes.data.map(p => ({ ...p, type: 'password' })),
                ...filesRes.data.map(f => ({ ...f, type: 'file' })),
                ...notesRes.data.map(n => ({ ...n, type: 'note' }))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

            setRecentItems(allItems);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-surface">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
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
            transition: { staggerChildren: 0.08 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-h-screen bg-surface">
            <Navbar />

            <main className="container mx-auto px-4 py-10">
                <div className="mb-10">
                    <h1 className="text-2xl font-semibold text-content mb-1">Welcome back, {user?.username}</h1>
                    <p className="text-content-muted text-sm">Your secure vault overview</p>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
                >
                    <Link href="/vault/passwords" className="block">
                        <motion.div
                            variants={itemVariants}
                            className="card card-hover p-5 cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="icon-container icon-blue">
                                    <Key className="w-5 h-5" />
                                </div>
                                <ArrowRight className="w-4 h-4 text-content-subtle opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0" />
                            </div>
                            <div className="text-3xl font-semibold text-content mb-1">{stats.passwords}</div>
                            <div className="text-sm text-content-muted">Stored Passwords</div>
                        </motion.div>
                    </Link>

                    <Link href="/vault/files" className="block">
                        <motion.div
                            variants={itemVariants}
                            className="card card-hover p-5 cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="icon-container icon-yellow">
                                    <FolderLock className="w-5 h-5" />
                                </div>
                                <ArrowRight className="w-4 h-4 text-content-subtle opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0" />
                            </div>
                            <div className="text-3xl font-semibold text-content mb-1">{stats.files}</div>
                            <div className="text-sm text-content-muted">Encrypted Files</div>
                        </motion.div>
                    </Link>

                    <Link href="/vault/notes" className="block">
                        <motion.div
                            variants={itemVariants}
                            className="card card-hover p-5 cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="icon-container icon-purple">
                                    <StickyNote className="w-5 h-5" />
                                </div>
                                <ArrowRight className="w-4 h-4 text-content-subtle opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0" />
                            </div>
                            <div className="text-3xl font-semibold text-content mb-1">{stats.notes}</div>
                            <div className="text-sm text-content-muted">Secure Notes</div>
                        </motion.div>
                    </Link>

                    <motion.div variants={itemVariants} className="card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="icon-container icon-green">
                                <Lock className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="text-xl font-semibold text-content mb-1">Secured</div>
                        <div className="text-sm text-content-muted">AES-256 • RSA-2048</div>
                    </motion.div>
                </motion.div>

                <h2 className="text-lg font-semibold text-content mb-5">Recent Items</h2>

                <div className="space-y-3">
                    {recentItems.length === 0 ? (
                        <div className="card p-12 text-center border-dashed">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-surface-subtle mb-4">
                                <FolderLock className="w-7 h-7 text-content-subtle" />
                            </div>
                            <h3 className="text-lg font-medium text-content mb-2">Your vault is empty</h3>
                            <p className="text-content-muted text-sm mb-6">Start by adding passwords or uploading secure files.</p>
                            <div className="flex items-center justify-center gap-3">
                                <Link href="/vault/passwords" className="btn-primary">
                                    Add Password
                                </Link>
                                <Link href="/vault/files" className="btn-secondary">
                                    Upload File
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentItems.map((item, index) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={`${item.type}-${item.id}`}
                                    className="card card-hover p-4 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "icon-container",
                                            item.type === 'password' ? 'icon-blue' : item.type === 'note' ? 'icon-purple' : 'icon-yellow'
                                        )}>
                                            {item.type === 'password' ? <Key className="w-5 h-5" /> : item.type === 'note' ? <StickyNote className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="font-medium text-content group-hover:text-accent-blue transition-colors">{item.name || item.title}</div>
                                            <div className="text-xs text-content-subtle flex items-center gap-2">
                                                <span className="capitalize">{item.type === 'password' ? 'Password' : item.type === 'note' ? 'Note' : item.file_name}</span>
                                                <span>•</span>
                                                <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Link
                                        href={item.type === 'password' ? '/vault/passwords' : item.type === 'note' ? '/vault/notes' : '/vault/files'}
                                        className="btn-secondary px-4 py-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
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

function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}
