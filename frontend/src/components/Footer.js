'use client';

import Link from 'next/link';
import { Shield, Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        Product: [
            { name: 'Features', href: '#' },
            { name: 'Security', href: '#' },
            { name: 'Team', href: '#' },
            { name: 'Enterprise', href: '#' },
        ],
        Company: [
            { name: 'About', href: '#' },
            { name: 'Blog', href: '#' },
            { name: 'Careers', href: '#' },
            { name: 'Contact', href: '#' },
        ],
        Legal: [
            { name: 'Privacy', href: '#' },
            { name: 'Terms', href: '#' },
            { name: 'Cookie Policy', href: '#' },
        ]
    };

    return (
        <footer className="border-t border-surface-subtle bg-surface pt-14 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2.5 font-semibold text-lg">
                            <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center">
                                <Shield className="w-4.5 h-4.5 text-content" />
                            </div>
                            <span className="text-content">SecureVault</span>
                        </Link>
                        <p className="text-content-muted text-sm leading-relaxed max-w-xs">
                            Military-grade encryption for your most sensitive data.
                        </p>
                        <div className="flex gap-2 pt-1">
                            <SocialLink href="#" icon={Github} label="GitHub" />
                            <SocialLink href="#" icon={Twitter} label="Twitter" />
                            <SocialLink href="#" icon={Linkedin} label="LinkedIn" />
                        </div>
                    </div>

                    {/* Links Columns */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category} className="space-y-3">
                            <h3 className="font-medium text-content text-sm">{category}</h3>
                            <ul className="space-y-2">
                                {links.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-content-muted hover:text-accent-blue transition-colors"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-surface-subtle pt-6 text-center text-sm text-content-subtle">
                    <p>© {currentYear} SecureVault. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

function SocialLink({ href, icon: Icon, label }) {
    return (
        <a
            href={href}
            aria-label={label}
            className="p-2.5 rounded-full bg-surface-subtle text-content-muted hover:text-accent-blue transition-all border border-surface-border hover:border-accent-blue/30"
        >
            <Icon className="w-4 h-4" />
        </a>
    );
}
