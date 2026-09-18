"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";
import { clearAuth } from "@/lib/auth";
import { apiRequest, PROFILE_EVENT } from "@/lib/client";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { useAuthEmail, useAuthToken } from "@/hooks/useAuth";
import { initials } from "@/lib/utils";

const PUBLIC_LINKS = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search Trials" },
];

const MEMBER_LINKS = [
  { href: "/chat", label: "Assistant" },
  { href: "/profile", label: "Profile" },
];

const MENU_ITEMS = [
  { href: "/profile", label: "My profile", icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></> },
  { href: "/chat", label: "Assistant chats", icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> },
  { href: "/profile?tab=registrations", label: "Registrations", icon: <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /> },
  { href: "/profile?tab=saved", label: "Saved trials", icon: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /> },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAuthToken();
  const email = useAuthEmail();
  const loggedIn = typeof token === "string";

  const [fullName, setFullName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const links = loggedIn ? [...PUBLIC_LINKS, ...MEMBER_LINKS] : PUBLIC_LINKS;
  const name = loggedIn ? fullName : null;

  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    const load = () =>
      apiRequest<{ full_name: string | null }>("/auth/me")
        .then((me) => !cancelled && setFullName(me.full_name))
        .catch(() => {});
    load();
    window.addEventListener(PROFILE_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(PROFILE_EVENT, load);
    };
  }, [loggedIn]);

  // Close menus on route change (adjusting state during render, no effect needed)
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
    setUserMenuOpen(false);
  }

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  // Close the user menu on outside click / Escape
  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) setUserMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setUserMenuOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [userMenuOpen]);

  useGSAP(
    () => {
      if (!userMenuOpen || prefersReducedMotion()) return;
      gsap.from(".user-menu-panel", { y: -8, scale: 0.96, opacity: 0, duration: 0.28, ease: "power3.out", transformOrigin: "top right" });
      gsap.from(".user-menu-item", { x: 8, opacity: 0, stagger: 0.03, duration: 0.25, delay: 0.05 });
    },
    { scope: userMenuRef, dependencies: [userMenuOpen] }
  );

  const handleLogout = () => {
    clearAuth();
    setFullName(null);
    setMenuOpen(false);
    setUserMenuOpen(false);
    router.push("/");
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="w-full max-w-[100vw] px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <div className="flex shrink-0 md:flex-1 md:basis-0">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              Trial<span className="text-[var(--accent-light)]">Match</span>
            </span>
          </Link>
        </div>

        {/* Center links (desktop) */}
        <div className="hidden md:flex shrink-0 items-center justify-center gap-1">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link key={link.href} href={link.href} className="relative px-4 py-2 text-sm transition-colors">
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
                    className="absolute inset-0 -z-10 rounded-full bg-[var(--surface-hover)] border border-[var(--border)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
          {token === null && (
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link href="/register" className="btn-primary ml-2 inline-flex px-4 py-2 rounded-full text-sm font-medium">
                Get Started
              </Link>
            </motion.div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0 md:flex-1 md:basis-0">
          <ThemeToggle />

          <div className="hidden md:flex items-center gap-2">
            {loggedIn && (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent-light)] to-[var(--accent)] text-white text-[11px] font-semibold flex items-center justify-center">
                    {initials(name, email)}
                  </span>
                  <span className="hidden lg:inline text-sm text-[var(--text-secondary)] max-w-[140px] truncate">
                    {name || email}
                  </span>
                  <svg className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="3">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div role="menu" className="user-menu-panel absolute right-0 mt-2 w-64 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)] p-2">
                    <div className="px-3 py-2.5 mb-1 border-b border-[var(--border)]">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{name || "Welcome"}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{email}</p>
                      {!name && (
                        <Link href="/profile" className="mt-2 inline-block text-xs text-accent hover:underline">
                          Complete your profile →
                        </Link>
                      )}
                    </div>
                    {MENU_ITEMS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                        className="user-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                          {item.icon}
                        </svg>
                        {item.label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="user-menu-item mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors border-t border-[var(--border)]"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                      </svg>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            )}
            {token === null && (
              <>
                <Link
                  href="/login"
                  className="inline-flex px-4 py-1.5 rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Login
                </Link>
                <Link href="/register" className="btn-ghost inline-flex px-4 py-1.5 rounded-full text-sm">
                  Register
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
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
              {loggedIn && (
                <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)]">
                  <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent-light)] to-[var(--accent)] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                    {initials(name, email)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{name || "Welcome"}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{email}</p>
                  </div>
                </div>
              )}

              {links.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      active
                        ? "bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-col gap-1">
                {loggedIn ? (
                  <button type="button" onClick={handleLogout} className="btn-ghost rounded-xl px-4 py-3 text-sm text-left">
                    Log out
                  </button>
                ) : (
                  <>
                    <Link href="/register" className="btn-primary inline-flex justify-center px-4 py-3 rounded-xl text-sm font-medium">
                      Get Started
                    </Link>
                    <Link
                      href="/login"
                      className="rounded-xl px-4 py-3 text-sm text-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]"
                    >
                      Login
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
