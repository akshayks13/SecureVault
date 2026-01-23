'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-8 relative z-10"
            >
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-accent-blue/20 blur-2xl rounded-full" />
                    <FileQuestion className="w-32 h-32 text-accent-blue relative z-10 mx-auto" strokeWidth={1.5} />
                </div>

                <div className="space-y-4">
                    <h1 className="text-6xl font-bold tracking-tight text-content">404</h1>
                    <h2 className="text-2xl font-medium text-content-muted">Page Not Found</h2>
                    <p className="text-content-muted max-w-md mx-auto">
                        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/"
                        className="btn-primary"
                    >
                        <Home className="w-4 h-4" />
                        Go Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="btn-secondary"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
