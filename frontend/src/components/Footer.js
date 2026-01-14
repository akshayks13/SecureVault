'use client';

import Link from 'next/link';
import { Shield, Github, Twitter, Linkedin, Heart } from 'lucide-react';

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
        <footer className="border-t border-white/10 bg-background pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                            <Shield className="w-8 h-8 text-blue-500" />
                            <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                                SecureVault
                            </span>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                            Military-grade encryption for your most sensitive data.
                            Built for individuals and teams who refuse to compromise on security.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <SocialLink href="#" icon={Github} label="GitHub" />
                            <SocialLink href="#" icon={Twitter} label="Twitter" />
                            <SocialLink href="#" icon={Linkedin} label="LinkedIn" />
                        </div>
                    </div>

                    {/* Links Columns */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category} className="space-y-4">
                            <h3 className="font-semibold text-foreground tracking-wide">{category}</h3>
                            <ul className="space-y-2">
                                {links.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-blue-400 transition-colors"
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
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>© {currentYear} SecureVault Inc. All rights reserved.</p>
                    <div className="flex items-center gap-1">
                        <span>Made with</span>
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                        <span>for a more secure web.</span>
                    </div>
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
            className="p-2 rounded-full bg-white/5 hover:bg-blue-500/10 hover:text-blue-400 text-muted-foreground transition-all border border-white/10 hover:border-blue-500/50"
        >
            <Icon className="w-4 h-4" />
        </a>
    );
}
