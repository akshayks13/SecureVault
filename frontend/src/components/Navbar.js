'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User, Activity, Shield, Users, FileText, Lock, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const isActive = (path) => pathname === path;

    // Don't show navbar on auth pages
    if (['/login', '/register', '/verify-otp', '/forgot-password', '/reset-password'].includes(pathname)) {
        return null;
    }

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: Activity },
        { href: '/vault/passwords', label: 'Passwords', icon: Lock },
        { href: '/vault/files', label: 'Files', icon: FileText },
        { href: '/vault/notes', label: 'Notes', icon: StickyNote },
        { href: '/password-health', label: 'Health', icon: Shield },
        { href: '/teams', label: 'Teams', icon: Users },
    ];

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="sticky top-0 z-50 w-full bg-surface/95 backdrop-blur-md border-b border-surface-subtle"
        >
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2.5 font-semibold text-lg hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center">
                        <Shield className="w-4.5 h-4.5 text-content" />
                    </div>
                    <span className="text-content">SecureVault</span>
                </Link>

                {isAuthenticated ? (
                    <div className="flex items-center gap-2">
                        <ul className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                                                active
                                                    ? "bg-accent-blue/10 text-accent-blue"
                                                    : "text-content-muted hover:text-content hover:bg-surface-subtle"
                                            )}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {item.label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="flex items-center gap-1 ml-4 pl-4 border-l border-surface-subtle">
                            <Link
                                href="/profile"
                                className={cn(
                                    "p-2.5 rounded-full transition-all duration-200",
                                    isActive('/profile')
                                        ? "text-accent-blue bg-accent-blue/10"
                                        : "text-content-muted hover:text-content hover:bg-surface-subtle"
                                )}
                            >
                                <User className="w-5 h-5" />
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="p-2.5 text-content-muted hover:text-accent-red hover:bg-accent-red/10 transition-all duration-200 rounded-full"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="btn-ghost"
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/register"
                            className="btn-primary"
                        >
                            Get Started
                        </Link>
                    </div>
                )}
            </div>
        </motion.nav>
    );
}
