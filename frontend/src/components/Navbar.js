'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const isActive = (path) => pathname === path;

    if (['/login', '/register', '/verify-otp'].includes(pathname)) {
        return null;
    }

    return (
        <nav className="navbar">
            <div className="container navbar-content">
                <Link href="/" className="navbar-brand">
                    <Image src="/logo.png" alt="SecureVault" width={28} height={28} />
                    SecureVault
                </Link>

                {isAuthenticated ? (
                    <ul className="navbar-nav">
                        <li>
                            <Link href="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
                                Dashboard
                            </Link>
                        </li>
                        <li>
                            <Link href="/vault/passwords" className={isActive('/vault/passwords') ? 'active' : ''}>
                                Passwords
                            </Link>
                        </li>
                        <li>
                            <Link href="/vault/files" className={isActive('/vault/files') ? 'active' : ''}>
                                Files
                            </Link>
                        </li>
                        <li>
                            <Link href="/profile" className={isActive('/profile') ? 'active' : ''}>
                                Profile
                            </Link>
                        </li>
                        <li>
                            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 1rem' }}>
                                Logout
                            </button>
                        </li>
                    </ul>
                ) : (
                    <ul className="navbar-nav">
                        <li><Link href="/login" className="btn btn-secondary">Login</Link></li>
                        <li><Link href="/register" className="btn btn-primary">Register</Link></li>
                    </ul>
                )}
            </div>
        </nav>
    );
}
