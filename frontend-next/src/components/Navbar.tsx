"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search Trials" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="w-full px-6 h-16 flex items-center">
        {/* Left — Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            Trial<span className="text-[var(--accent-light)]">Match</span>
          </span>
        </Link>

        {/* Center — Nav links */}
        <div className="flex-1 flex items-center justify-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm transition-colors"
              >
                <span
                  className={
                    active
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  }
                >
                  {link.label}
                </span>
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 -z-10 rounded-full bg-white/[0.06] border border-[var(--border)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              href="/search"
              className="btn-primary ml-2 inline-flex px-4 py-2 rounded-full text-sm font-medium"
            >
              Get Started
            </Link>
          </motion.div>
        </div>

        {/* Right — Theme + Auth buttons */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="px-4 py-1.5 rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Login
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="btn-ghost px-4 py-1.5 rounded-full text-sm"
          >
            Register
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}
