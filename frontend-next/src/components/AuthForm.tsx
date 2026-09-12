"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { login, register } from "@/lib/auth";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";

interface AuthFormProps {
  mode: "login" | "register";
}

const PERKS = [
  {
    title: "Personal health profile",
    text: "Save conditions, medications and labs once, then reuse them for every search.",
    icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  },
  {
    title: "AI trial matching",
    text: "Recruiting trials ranked for your condition, eligibility and location.",
    icon: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  },
  {
    title: "Chat with the assistant",
    text: "Ask follow-up questions about any match in plain language.",
    icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
  {
    title: "Register interest",
    text: "Track the trials you want to join, all in one place.",
    icon: <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />,
  },
];

function safeNext(value: string | null): string | null {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const container = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLogin = mode === "login";
  const switchHref = `${isLogin ? "/register" : "/login"}${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".auth-heading-line", { yPercent: 110, duration: 0.9, stagger: 0.1 })
        .from(".auth-perk", { x: -24, opacity: 0, stagger: 0.09, duration: 0.6 }, 0.25)
        .from(".auth-card", { y: 30, opacity: 0, duration: 0.8 }, 0.1)
        .from(".auth-field", { y: 14, opacity: 0, stagger: 0.07, duration: 0.5 }, 0.35);
      gsap.to(".auth-orb", { scale: 1.15, opacity: 0.9, duration: 4, ease: "sine.inOut", repeat: -1, yoyo: true });
    },
    { scope: container }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        router.push(next ?? "/search");
      } else {
        await register(email, password);
        // Auto-login right after a successful registration, then set up the profile
        await login(email, password);
        router.push("/profile?welcome=1");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      if (!prefersReducedMotion()) {
        gsap.fromTo(".auth-card", { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={container} className="relative min-h-screen flex items-center px-4 sm:px-6 pt-24 sm:pt-28 pb-12 sm:pb-16 overflow-hidden">
      <div className="auth-orb absolute top-1/3 left-1/4 w-[min(520px,90vw)] h-[min(520px,90vw)] rounded-full bg-[var(--accent)]/[0.08] blur-[120px] pointer-events-none opacity-60" />

      <div className="relative w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Left — value proposition */}
        <div className="hidden lg:block">
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-[var(--accent-light)]">
            {isLogin ? "Welcome back" : "Join TrialMatch"}
          </span>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight leading-[1.08]">
            <span className="block overflow-hidden">
              <span className="auth-heading-line block text-gradient">Your trial journey,</span>
            </span>
            <span className="block overflow-hidden">
              <span className="auth-heading-line block text-[var(--text-primary)]">all in one place.</span>
            </span>
          </h1>
          <ul className="mt-10 space-y-5">
            {PERKS.map((perk) => (
              <li key={perk.title} className="auth-perk flex items-start gap-4">
                <span className="w-10 h-10 shrink-0 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/25 text-[var(--accent-light)] flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    {perk.icon}
                  </svg>
                </span>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{perk.title}</p>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">{perk.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — form */}
        <div className="auth-card card card-glow w-full max-w-md mx-auto lg:ml-auto rounded-3xl p-6 sm:p-9">
          <h2 className="auth-field text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            {isLogin ? "Sign in" : "Create your account"}
          </h2>
          <p className="auth-field mt-2 text-sm text-[var(--text-secondary)]">
            {isLogin
              ? "Pick up where you left off: searches, chats and registrations."
              : "Free to use. Set up your health profile right after."}
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div className="auth-field">
              <label htmlFor="auth-email" className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="field"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="auth-password" className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="field"
              />
            </div>

            {error && (
              <p className="text-sm text-[var(--danger)]" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="auth-field btn-primary w-full rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-60 active:scale-[0.99]"
            >
              {loading
                ? isLogin
                  ? "Signing in..."
                  : "Creating account..."
                : isLogin
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <p className="auth-field mt-6 text-center text-sm text-[var(--text-secondary)]">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <Link href={switchHref} className="text-accent hover:underline">
              {isLogin ? "Register" : "Sign in"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
