"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import StatsCounter from "@/components/StatsCounter";
import FeatureCard from "@/components/FeatureCard";
import GlobeSection from "@/components/GlobeSection";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FEATURES = [
  {
    title: "Patient Profile Extraction",
    description:
      "AI extracts age, conditions, medications, lab values, and location from natural language input.",
    icon: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  },
  {
    title: "Semantic Condition Matching",
    description:
      "Embeddings-based search over 500+ medical conditions finds relevant matches even with informal language.",
    icon: (
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </>
    ),
  },
  {
    title: "Eligibility Scoring",
    description:
      "Each trial's inclusion/exclusion criteria are evaluated against your profile for compatibility.",
    icon: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  },
  {
    title: "Cross-Encoder Reranking",
    description:
      "A neural reranker refines initial results to surface the most promising trials.",
    icon: (
      <>
        <path d="M12 2L2 7l10 5 10-5-10-5Z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </>
    ),
  },
  {
    title: "Location-Aware",
    description:
      "Trials are prioritized by proximity to your location with global coverage across 195+ countries.",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </>
    ),
  },
  {
    title: "Plain-Language Explanations",
    description:
      "Complex medical eligibility criteria are rewritten in clear, patient-friendly language.",
    icon: (
      <>
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14Z" />
        <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </>
    ),
  },
];

export default function Home() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Hero headline: line-by-line reveal
      gsap.from(".hero-line", {
        yPercent: 120,
        opacity: 0,
        duration: 1,
        ease: "power4.out",
        stagger: 0.12,
        delay: 0.1,
      });

      gsap.from(".hero-fade", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.1,
        delay: 0.6,
      });

      // Section headers reveal on scroll
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
          },
        });
      });
    },
    { scope: container }
  );

  return (
    <div ref={container} className="relative">
      {/* Hero Section */}
      <section className="relative min-h-[100svh] flex items-center pt-16 pb-10 lg:pb-0">
        {/* Ambient blue glow */}
        <div className="absolute top-1/4 right-0 w-[min(600px,100vw)] h-[min(600px,100vw)] rounded-full bg-[var(--accent)]/[0.07] blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full">
          {/* Left - Text */}
          <div className="min-w-0">
            <div className="hero-fade inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-[var(--border)] mb-5 sm:mb-7 max-w-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-light)] animate-pulse shrink-0" />
              <span className="text-[11px] sm:text-xs text-[var(--text-secondary)] tracking-wide truncate">
                AI-Powered Clinical Trial Matching
              </span>
            </div>

            <h1 className="text-[2.35rem] sm:text-5xl lg:text-[4.2rem] font-semibold leading-[1.08] tracking-tight mb-5 sm:mb-7">
              <span className="block overflow-hidden">
                <span className="hero-line block text-gradient">Find the right</span>
              </span>
              <span className="block overflow-hidden">
                <span className="hero-line block text-[var(--text-primary)]">clinical trial</span>
              </span>
              <span className="block overflow-hidden">
                <span className="hero-line block text-gradient">in seconds.</span>
              </span>
            </h1>

            <p className="hero-fade text-base sm:text-lg text-[var(--text-secondary)] mb-7 sm:mb-9 max-w-lg leading-relaxed">
              TrialMatch uses semantic AI to connect patients with recruiting
              clinical trials worldwide. Describe your condition and get
              personalized matches instantly.
            </p>

            <div className="hero-fade flex flex-wrap items-center gap-3">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/search"
                  className="btn-primary inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-medium text-sm sm:text-base"
                >
                  Start Matching
                  <span aria-hidden>→</span>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <a
                  href="#features"
                  className="btn-ghost inline-flex px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm sm:text-base"
                >
                  Learn More
                </a>
              </motion.div>
            </div>
          </div>

          {/* Right - Globe */}
          <div className="h-[300px] sm:h-[420px] lg:h-[620px] relative -mx-2 sm:mx-0">
            <GlobeSection />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-20 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <StatsCounter />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="reveal max-w-2xl mb-10 sm:mb-16">
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-[var(--accent-light)]">
              How it works
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-semibold tracking-tight mt-3 mb-4 text-gradient">
              A precise matching pipeline
            </h2>
            <p className="text-[var(--text-secondary)] text-base sm:text-lg">
              Every query flows through multiple AI stages to surface the most
              relevant clinical trials.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {FEATURES.map((feature, i) => (
              <FeatureCard
                key={feature.title}
                delay={i * 0.08}
                title={feature.title}
                description={feature.description}
                icon={
                  <svg
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    {feature.icon}
                  </svg>
                }
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-28 relative">
        <div className="reveal max-w-4xl mx-auto px-4 sm:px-6">
          <div className="card relative overflow-hidden rounded-2xl sm:rounded-3xl px-5 sm:px-8 py-10 sm:py-16 text-center">
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/[0.06] to-transparent pointer-events-none" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight mb-4 text-gradient">
                Ready to find your match?
              </h2>
              <p className="text-[var(--text-secondary)] text-base sm:text-lg mb-6 sm:mb-8 max-w-xl mx-auto">
                Describe your condition in plain English. Our AI does the rest.
              </p>
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block max-w-full"
              >
                <Link
                  href="/search"
                  className="btn-primary inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-medium text-base sm:text-lg"
                >
                  Search Clinical Trials
                  <span aria-hidden>→</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
          <span className="text-sm text-[var(--text-secondary)]">
            © 2026 TrialMatch. For informational purposes only.
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            Final eligibility must be confirmed with the trial site.
          </span>
        </div>
      </footer>
    </div>
  );
}
