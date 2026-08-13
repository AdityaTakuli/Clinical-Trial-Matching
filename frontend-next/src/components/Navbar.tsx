"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";
import { AUTH_EVENT, clearAuth, getEmail } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search Trials" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sync = () => setEmail(getEmail());
    sync();
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while menu is open
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const handleLogout = () => {
    clearAuth();
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="w-full max-w-[100vw] px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left — Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <span className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            Trial<span className="text-[var(--accent-light)]">Match</span>
          </span>
        </Link>

        {/* Center — Nav links (desktop) */}
        <div className="hidden md:flex flex-1 items-center justify-center gap-1">
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

        {/* Right — Theme + Auth (desktop) + hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemeToggle />

          <div className="hidden md:flex items-center gap-2">
            {email ? (
              <>
                <span className="hidden lg:inline px-3 text-sm text-[var(--text-secondary)] max-w-[180px] truncate">
                  {email}
                </span>
                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="btn-ghost px-4 py-1.5 rounded-full text-sm"
                >
                  Logout
                </motion.button>
              </>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link
                    href="/login"
                    className="inline-flex px-4 py-1.5 rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Login
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link
                    href="/register"
                    className="btn-ghost inline-flex px-4 py-1.5 rounded-full text-sm"
                  >
                    Register
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full text-[var(--text-primary)] hover:bg-white/[0.06] transition-colors"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? (
                <>
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </>
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden border-t border-[var(--border)] bg-[var(--bg-primary)]/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      active
                        ? "bg-white/[0.06] text-[var(--text-primary)] border border-[var(--border)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.03]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <Link
                href="/search"
                className="btn-primary mt-2 inline-flex justify-center px-4 py-3 rounded-xl text-sm font-medium"
              >
                Get Started
              </Link>

              <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-col gap-1">
                {email ? (
                  <>
                    <span className="px-4 py-2 text-xs text-[var(--text-muted)] truncate">
                      {email}
                    </span>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="btn-ghost rounded-xl px-4 py-3 text-sm text-left"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="rounded-xl px-4 py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.03]"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="btn-ghost rounded-xl px-4 py-3 text-sm text-center"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
