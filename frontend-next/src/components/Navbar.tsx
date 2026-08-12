"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="w-full px-6 h-16 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 group mr-auto">
          <span className="text-xl font-bold tracking-tight text-[var(--text-primary)] group-hover:text-white transition-colors">
            trial<span className="text-[var(--accent)]">match</span>
          </span>
        </Link>

        <Link
          href="/"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Home
        </Link>
        <Link
          href="/search"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Search Trials
        </Link>
        <Link
          href="/search"
          className="px-4 py-2 rounded-full bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-light)] transition-colors shadow-lg shadow-[var(--accent-glow)]"
        >
          Get Started
        </Link>
      </div>
    </motion.nav>
  );
}
