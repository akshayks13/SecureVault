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
            className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md"
        >
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
                    <Shield className="w-8 h-8 text-blue-500" />
                    <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                        SecureVault
                    </span>
                </Link>

                {isAuthenticated ? (
                    <div className="flex items-center gap-6">
                        <ul className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                                active
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                            )}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {item.label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                            <Link
                                href="/profile"
                                className={cn(
                                    "p-2 rounded-full hover:bg-white/5 transition-colors",
                                    isActive('/profile') ? "text-primary bg-primary/10" : "text-muted-foreground"
                                )}
                            >
                                <User className="w-5 h-5" />
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-destructive/10"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                        >
                            Get Started
                        </Link>
                    </div>
                )}
            </div>
        </motion.nav>
    );
}
