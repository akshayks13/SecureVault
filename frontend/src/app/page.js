'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { Shield, Lock, FileSignature, Smartphone, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const { isAuthenticated } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <main className="min-h-screen bg-surface text-content overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-40 overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-3xl mx-auto"
          >
            <motion.div
              variants={itemVariants}
              className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-subtle border border-surface-border text-sm font-medium text-accent-blue"
            >
              <Shield className="w-4 h-4" />
              <span>Military-Grade Security</span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-semibold tracking-tight mb-6">
              Your Digital Vault,<br />
              <span className="text-accent-blue">Unbreakable.</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-lg text-content-muted mb-10 max-w-xl mx-auto leading-relaxed">
              Store passwords and files with military-grade encryption.
              Multi-factor authentication and digital signatures keep your data secure.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link href="/dashboard" className="btn-primary">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link href="/register" className="btn-primary">
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/login" className="btn-secondary">
                    Sign in
                  </Link>
                </>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-surface-elevated">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-2xl font-semibold text-content mb-3">Security Features</h2>
            <p className="text-content-muted max-w-lg mx-auto text-sm">
              We use the most advanced encryption standards to ensure your data remains yours alone.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              iconColor="text-accent-blue"
              iconBg="bg-accent-blue/10"
              title="AES-256 Encryption"
              description="Your files and passwords are encrypted with military-grade AES-256-GCM encryption."
              delay={0}
            />
            <FeatureCard
              icon={<Lock className="w-6 h-6" />}
              iconColor="text-accent-green"
              iconBg="bg-accent-green/10"
              title="bcrypt Hashing"
              description="Passwords are hashed with bcrypt and automatic salt generation for maximum security."
              delay={0.1}
            />
            <FeatureCard
              icon={<FileSignature className="w-6 h-6" />}
              iconColor="text-accent-purple"
              iconBg="bg-accent-purple/10"
              title="Digital Signatures"
              description="RSA-2048 signatures detect any tampering with your stored files instantly."
              delay={0.2}
            />
            <FeatureCard
              icon={<Smartphone className="w-6 h-6" />}
              iconColor="text-accent-yellow"
              iconBg="bg-accent-yellow/10"
              title="Multi-Factor Auth"
              description="OTP verification adds an extra critical layer of security to your account."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}

function FeatureCard({ icon, iconColor, iconBg, title, description, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
      className="card card-hover p-6"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <h3 className="text-base font-medium text-content mb-2">{title}</h3>
      <p className="text-content-muted text-sm leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
