"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import StatsCounter from "@/components/StatsCounter";
import FeatureCard from "@/components/FeatureCard";

const Globe = dynamic(() => import("@/components/Globe"), { ssr: false });

export default function Home() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Background gradient orbs */}
        <div className="absolute top-20 left-10 w-[500px] h-[500px] rounded-full bg-[var(--accent)]/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left - Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
              <span className="text-xs text-[var(--accent-light)]">
                AI-Powered Clinical Trial Matching
              </span>
            </motion.div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Find the right
              <br />
              <span className="gradient-text">clinical trial</span>
              <br />
              in seconds.
            </h1>

            <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-lg leading-relaxed">
              TrialMatch uses semantic AI to connect patients with recruiting
              clinical trials worldwide. Describe your condition and get
              personalized matches instantly.
            </p>

            <div className="flex items-center gap-4">
              <Link
                href="/search"
                className="px-6 py-3 rounded-full bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-light)] transition-all shadow-lg shadow-[var(--accent-glow)] hover:shadow-xl hover:shadow-[var(--accent-glow)]"
              >
                Start Matching →
              </Link>
              <a
                href="#features"
                className="px-6 py-3 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/50 transition-all"
              >
                Learn More
              </a>
            </div>
          </motion.div>

          {/* Right - Globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="h-[520px] lg:h-[620px] relative overflow-visible"
          >
            <Globe />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-full">
              <span className="text-xs text-[var(--text-secondary)]">
                🌐 20+ countries • Live trial locations
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6">
          <StatsCounter />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              How TrialMatch Works
            </h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              Our AI pipeline processes your information through multiple stages
              to find the most relevant clinical trials.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              delay={0}
              icon={
                <svg width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
              title="Patient Profile Extraction"
              description="AI extracts age, conditions, medications, lab values, and location from natural language input."
            />
            <FeatureCard
              delay={0.1}
              icon={
                <svg width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              }
              title="Semantic Condition Matching"
              description="Embeddings-based search over 500+ medical conditions finds relevant matches even with informal language."
            />
            <FeatureCard
              delay={0.2}
              icon={
                <svg width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              }
              title="Eligibility Scoring"
              description="Each trial's inclusion/exclusion criteria are evaluated against your profile for compatibility."
            />
            <FeatureCard
              delay={0.3}
              icon={
                <svg width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5Z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              }
              title="Cross-Encoder Reranking"
              description="A neural reranker refines initial results to surface the most promising trials."
            />
            <FeatureCard
              delay={0.4}
              icon={
                <svg width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
              }
              title="Location-Aware"
              description="Trials are prioritized by proximity to your location with global coverage across 195+ countries."
            />
            <FeatureCard
              delay={0.5}
              icon={
                <svg width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14Z" />
                  <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
              }
              title="Plain-Language Explanations"
              description="Complex medical eligibility criteria are rewritten in clear, patient-friendly language."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--accent)]/5 to-transparent pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto px-6 text-center"
        >
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to find your match?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Describe your condition in plain English. Our AI does the rest.
          </p>
          <Link
            href="/search"
            className="inline-flex px-8 py-4 rounded-full bg-[var(--accent)] text-white font-medium text-lg hover:bg-[var(--accent-light)] transition-all shadow-lg shadow-[var(--accent-glow)] hover:shadow-xl"
          >
            Search Clinical Trials →
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <span className="text-sm text-[var(--text-secondary)]">
            © 2026 TrialMatch. For informational purposes only.
          </span>
          <span className="text-xs text-[var(--text-secondary)]">
            Final eligibility must be confirmed with the trial site.
          </span>
        </div>
      </footer>
    </div>
  );
}
