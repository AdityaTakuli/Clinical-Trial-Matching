"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ProfileForm from "@/components/profile/ProfileForm";
import RegisterTrialDialog from "@/components/RegisterTrialDialog";
import Magnetic from "@/components/anim/Magnetic";
import { useAuthEmail, useRequireAuth } from "@/hooks/useAuth";
import { isDevAuthBypass } from "@/lib/auth";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import {
  ApiError,
  Profile,
  Registration,
  SavedTrial,
  SearchHistoryItem,
  createChatSession,
  getProfile,
  listRegistrations,
  listSavedTrials,
  listSearchHistory,
  unsaveTrial,
  withdrawRegistration,
} from "@/lib/client";
import { initials, parseServerDate, timeAgo } from "@/lib/utils";

const TABS = [
  { id: "profile", label: "Health profile" },
  { id: "registrations", label: "Registrations" },
  { id: "saved", label: "Saved trials" },
  { id: "history", label: "Search history" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ProfileApp />
    </Suspense>
  );
}

function CompletionRing({ value }: { value: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  useGSAP(
    () => {
      const arc = ref.current?.querySelector(".ring-arc");
      if (!arc || !labelRef.current) return;
      const target = circumference * (1 - value / 100);
      if (prefersReducedMotion()) {
        gsap.set(arc, { strokeDashoffset: target });
        labelRef.current.textContent = `${value}%`;
        return;
      }
      const counter = { n: Number(labelRef.current.dataset.value ?? 0) };
      gsap.to(arc, { strokeDashoffset: target, duration: 1.4, ease: "power3.out" });
      gsap.to(counter, {
        n: value,
        duration: 1.4,
        ease: "power3.out",
        onUpdate: () => {
          if (!labelRef.current) return;
          labelRef.current.textContent = `${Math.round(counter.n)}%`;
          labelRef.current.dataset.value = String(counter.n);
        },
      });
    },
    { dependencies: [value] }
  );

  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg ref={ref} viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--border)" strokeWidth="7" />
        <circle
          className="ring-arc"
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="url(#ring-gradient)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
        />
        <defs>
          <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5b95ff" />
            <stop offset="100%" stopColor="#2f74ff" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span ref={labelRef} className="text-lg font-semibold tabular-nums text-[var(--text-primary)]">
          0%
        </span>
        <span className="text-[9px] uppercase tracking-[0.15em] text-[var(--text-muted)]">complete</span>
      </div>
    </div>
  );
}

function EmptyState({ title, text, href, cta }: { title: string; text: string; href: string; cta: string }) {
  return (
    <div data-reveal className="text-center py-14 px-4 rounded-2xl border border-dashed border-[var(--border-strong)]">
      <p className="font-medium text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-sm mx-auto">{text}</p>
      <Link href={href} className="btn-primary mt-5 inline-flex px-5 py-2 rounded-full text-sm font-medium">
        {cta}
      </Link>
    </div>
  );
}

function ProfileApp() {
  const ready = useRequireAuth("/profile");
  const email = useAuthEmail();
  const router = useRouter();
  const params = useSearchParams();
  const welcome = params.get("welcome") === "1";

  const initialTab = TABS.find((t) => t.id === params.get("tab"))?.id ?? "profile";
  const [tab, setTab] = useState<TabId>(initialTab);
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [saved, setSaved] = useState<SavedTrial[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [registerTarget, setRegisterTarget] = useState<SavedTrial | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  const handleError = (err: unknown, fallback: string) => {
    if (err instanceof ApiError && err.status === 401 && !isDevAuthBypass()) {
      router.replace("/login?next=/profile");
      return;
    }
    setError(err instanceof Error ? err.message : fallback);
  };

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    Promise.allSettled([getProfile(), listRegistrations(), listSavedTrials(), listSearchHistory()]).then(
      ([p, r, s, h]) => {
        if (cancelled) return;
        const unauthorized = [p, r, s, h].some(
          (x) => x.status === "rejected" && x.reason instanceof ApiError && x.reason.status === 401
        );
        if (unauthorized && !isDevAuthBypass()) {
          router.replace("/login?next=/profile");
          return;
        }
        if (p.status === "fulfilled") setProfile(p.value);
        if (r.status === "fulfilled") setRegistrations(r.value);
        if (s.status === "fulfilled") setSaved(s.value);
        if (h.status === "fulfilled") setHistory(h.value);
        if (p.status === "rejected") setError("Couldn't load your profile. Is the backend running?");
        setLoaded(true);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [ready, router]);

  // Page entrance
  useGSAP(
    () => {
      if (!loaded || prefersReducedMotion()) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".hero-card", { y: 30, opacity: 0, duration: 0.8 })
        .from(".hero-avatar", { scale: 0.6, opacity: 0, duration: 0.7, ease: "back.out(1.8)" }, "-=0.55")
        .from(".hero-line", { y: 14, opacity: 0, stagger: 0.07, duration: 0.5 }, "-=0.45")
        .from(".stat-tile", { y: 20, opacity: 0, stagger: 0.08, duration: 0.55 }, "-=0.35")
        .from(".tabs-bar", { y: 12, opacity: 0, duration: 0.5 }, "-=0.3");

      gsap.utils.toArray<HTMLElement>(".stat-value").forEach((el) => {
        const end = Number(el.dataset.value ?? 0);
        const counter = { n: 0 };
        gsap.to(counter, {
          n: end,
          duration: 1.2,
          delay: 0.5,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = String(Math.round(counter.n));
          },
        });
      });
    },
    { scope: rootRef, dependencies: [loaded] }
  );

  // Sliding tab indicator
  useGSAP(
    () => {
      const active = tabsRef.current?.querySelector<HTMLElement>(`[data-tab="${tab}"]`);
      if (!active || !indicatorRef.current) return;
      gsap.to(indicatorRef.current, {
        x: active.offsetLeft,
        width: active.offsetWidth,
        duration: prefersReducedMotion() ? 0 : 0.45,
        ease: "power3.out",
      });
      active.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    },
    { dependencies: [tab, loaded] }
  );

  // Tab panel content
  useGSAP(
    () => {
      if (!loaded || prefersReducedMotion()) return;
      gsap.from(".tab-panel [data-reveal]", {
        y: 18,
        opacity: 0,
        stagger: 0.05,
        duration: 0.5,
        ease: "power3.out",
        clearProps: "transform,opacity",
      });
    },
    { scope: rootRef, dependencies: [tab, loaded] }
  );

  const selectTab = (id: TabId) => {
    setTab(id);
    router.replace(id === "profile" ? "/profile" : `/profile?tab=${id}`, { scroll: false });
  };

  const askAbout = async (nctId: string, title: string | null) => {
    setBusy(`ask-${nctId}`);
    try {
      const session = await createChatSession({
        title: `About ${nctId}`,
        context: { trials: [{ nct_id: nctId, title: title ?? undefined }] },
      });
      const qs = new URLSearchParams({
        session: String(session.id),
        prompt: `What should I know about ${nctId}, and what should I ask the study team?`,
      });
      router.push(`/chat?${qs}`);
    } catch (err) {
      setBusy(null);
      handleError(err, "Couldn't start a conversation");
    }
  };

  const withdraw = async (nctId: string) => {
    setBusy(`withdraw-${nctId}`);
    try {
      await withdrawRegistration(nctId);
      setRegistrations((prev) => prev.filter((r) => r.nct_id !== nctId));
    } catch (err) {
      handleError(err, "Couldn't withdraw registration");
    } finally {
      setBusy(null);
    }
  };

  const removeSaved = async (nctId: string) => {
    setBusy(`unsave-${nctId}`);
    try {
      await unsaveTrial(nctId);
      setSaved((prev) => prev.filter((s) => s.nct_id !== nctId));
    } catch (err) {
      handleError(err, "Couldn't remove saved trial");
    } finally {
      setBusy(null);
    }
  };

  if (!ready || !loaded) {
    return (
      <div className="min-h-screen pt-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="h-44 rounded-3xl bg-[var(--surface-subtle)] animate-pulse" />
          <div className="h-12 w-2/3 rounded-2xl bg-[var(--surface-subtle)] animate-pulse" />
          <div className="h-96 rounded-3xl bg-[var(--surface-subtle)] animate-pulse" />
        </div>
      </div>
    );
  }

  const registeredIds = new Set(registrations.map((r) => r.nct_id));
  const displayName = profile?.full_name || email?.split("@")[0] || "Your profile";
  const memberSince = profile?.updated_at ? `Updated ${timeAgo(profile.updated_at)}` : "Profile not created yet";
  const stats = [
    { label: "Registrations", value: registrations.length, tab: "registrations" as TabId },
    { label: "Saved trials", value: saved.length, tab: "saved" as TabId },
    { label: "Searches", value: history.length, tab: "history" as TabId },
  ];

  return (
    <div ref={rootRef} className="relative min-h-screen pt-24 sm:pt-28 pb-16 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[min(900px,120vw)] h-[420px] rounded-full bg-[var(--accent)]/[0.07] blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {welcome && !profile && (
          <div className="hero-line mb-5 p-4 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/25 flex items-start gap-3">
            <span className="text-xl leading-none">👋</span>
            <div className="text-sm">
              <p className="font-medium text-[var(--text-primary)]">Welcome to TrialMatch!</p>
              <p className="text-[var(--text-secondary)] mt-0.5">
                Set up your health profile below. We&apos;ll use it for one-click searches, smarter chat
                answers and trial registrations.
              </p>
            </div>
          </div>
        )}

        {/* Hero */}
        <section className="hero-card card card-glow relative overflow-hidden rounded-3xl p-5 sm:p-8">
          <div className="absolute -right-24 -bottom-24 w-72 h-72 rounded-full bg-[var(--accent)]/[0.1] blur-3xl pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
            <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
              <div className="hero-avatar relative shrink-0">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[var(--accent-light)] to-[var(--accent)] opacity-60 blur-md" />
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[var(--accent-light)] to-[var(--accent)] text-white text-xl sm:text-2xl font-semibold flex items-center justify-center ring-4 ring-[var(--bg-card)]">
                  {initials(profile?.full_name, email)}
                </div>
              </div>
              <div className="min-w-0">
                <span className="hero-line block text-[11px] font-medium tracking-[0.2em] uppercase text-[var(--accent-light)]">
                  My account
                </span>
                <h1 className="hero-line text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)] truncate">
                  {displayName}
                </h1>
                <p className="hero-line text-sm text-[var(--text-secondary)] truncate">{email}</p>
                <div className="hero-line mt-2 flex flex-wrap gap-1.5">
                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)]">
                    {memberSince}
                  </span>
                  {profile?.age != null && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)]">
                      {profile.age} yrs
                    </span>
                  )}
                  {(profile?.city || profile?.country) && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)]">
                      {[profile.city, profile.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <CompletionRing value={profile?.completion ?? 0} />
              <div className="flex flex-col gap-2">
                <Magnetic strength={0.2}>
                  <Link
                    href={profile ? "/search?useProfile=1" : "/profile"}
                    onClick={() => !profile && selectTab("profile")}
                    className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
                  >
                    Find my trials →
                  </Link>
                </Magnetic>
                <Link
                  href="/chat"
                  className="btn-ghost inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap"
                >
                  Ask the assistant
                </Link>
              </div>
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            {stats.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => selectTab(s.tab)}
                className="stat-tile text-left rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] hover:border-[var(--accent)]/40 px-3 sm:px-4 py-3 transition-colors"
              >
                <span data-value={s.value} className="stat-value block text-xl sm:text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
                  {s.value}
                </span>
                <span className="text-[11px] sm:text-xs text-[var(--text-muted)]">{s.label}</span>
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="mt-5 p-3 rounded-xl bg-red-500/[0.08] border border-red-500/25 text-red-500 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="tabs-bar sticky top-16 z-20 -mx-4 sm:mx-0 mt-8 px-4 sm:px-0 py-2 bg-[var(--bg-primary)]/80 backdrop-blur-xl">
          <div ref={tabsRef} role="tablist" className="relative flex gap-1 overflow-x-auto no-scrollbar p-1 rounded-full border border-[var(--border)] bg-[var(--bg-card)] w-fit max-w-full">
            <span ref={indicatorRef} className="absolute top-1 bottom-1 left-0 rounded-full bg-[var(--accent)] shadow-[0_6px_20px_-8px_var(--accent-glow)]" style={{ width: 0 }} />
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                data-tab={t.id}
                onClick={() => selectTab(t.id)}
                className={`relative z-10 whitespace-nowrap px-4 py-2 rounded-full text-sm transition-colors ${
                  tab === t.id ? "text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="tab-panel mt-6" key={tab}>
          {tab === "profile" && (
            <div className="card rounded-3xl p-5 sm:p-8">
              <ProfileForm initial={profile} onSaved={setProfile} />
            </div>
          )}

          {tab === "registrations" &&
            (registrations.length === 0 ? (
              <EmptyState
                title="No registrations yet"
                text="Find a trial you're interested in and tap “Register interest” to track it here."
                href="/search"
                cta="Search trials"
              />
            ) : (
              <div className="grid gap-3">
                {registrations.map((r) => (
                  <article key={r.id} data-reveal className="card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)]">
                          {r.nct_id}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--accent-soft)] border border-[var(--accent)]/25 text-[var(--accent-light)] capitalize">
                          {r.status.toLowerCase()}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {parseServerDate(r.created_at).toLocaleDateString()} · via {r.preferred_contact.toLowerCase()}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-medium text-[var(--text-primary)] line-clamp-2">
                        {r.title || r.nct_id}
                      </h3>
                      {r.message && <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-1">“{r.message}”</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => askAbout(r.nct_id, r.title)}
                        className="text-xs px-3 py-1.5 rounded-full bg-[var(--accent-soft)] border border-[var(--accent)]/30 text-[var(--accent-light)] hover:bg-[var(--accent)] hover:text-white transition-colors disabled:opacity-50"
                      >
                        {busy === `ask-${r.nct_id}` ? "Opening…" : "Ask AI"}
                      </button>
                      <a
                        href={`https://clinicaltrials.gov/study/${r.nct_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
                      >
                        Study page ↗
                      </a>
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => withdraw(r.nct_id)}
                        className="text-xs px-3 py-1.5 rounded-full text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        {busy === `withdraw-${r.nct_id}` ? "Withdrawing…" : "Withdraw"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ))}

          {tab === "saved" &&
            (saved.length === 0 ? (
              <EmptyState
                title="No saved trials"
                text="Bookmark promising trials from your search results to compare them later."
                href="/search"
                cta="Search trials"
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {saved.map((s) => {
                  const isRegistered = registeredIds.has(s.nct_id);
                  return (
                    <article key={s.id} data-reveal className="card rounded-2xl p-4 sm:p-5 flex flex-col">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-mono text-[var(--accent-light)]">{s.nct_id}</span>
                        <span className="text-[11px] text-[var(--text-muted)]">Saved {timeAgo(s.created_at)}</span>
                      </div>
                      <h3 className="text-sm font-medium text-[var(--text-primary)] line-clamp-3 flex-1">
                        {s.title || "Untitled trial"}
                      </h3>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {isRegistered ? (
                          <span className="text-xs px-3 py-1.5 rounded-full bg-[var(--accent)] text-white">Registered</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRegisterTarget(s)}
                            className="btn-primary text-xs px-3 py-1.5 rounded-full font-medium"
                          >
                            Register interest
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => askAbout(s.nct_id, s.title)}
                          className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors disabled:opacity-50"
                        >
                          {busy === `ask-${s.nct_id}` ? "Opening…" : "Ask AI"}
                        </button>
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => removeSaved(s.nct_id)}
                          className="ml-auto text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ))}

          {tab === "history" &&
            (history.length === 0 ? (
              <EmptyState
                title="No searches yet"
                text="Your past trial searches will appear here so you can run them again."
                href="/search"
                cta="Start a search"
              />
            ) : (
              <div className="card rounded-2xl divide-y divide-[var(--border)] overflow-hidden">
                {history.map((h) => (
                  <div key={h.id} data-reveal className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-[var(--surface-subtle)] transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--text-primary)] line-clamp-2">{h.query}</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {timeAgo(h.created_at)} · {h.result_count ?? 0} result{h.result_count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Link
                      href={`/search?q=${encodeURIComponent(h.query)}`}
                      className="self-start sm:self-center shrink-0 text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent-light)] hover:border-[var(--accent)] transition-colors"
                    >
                      Run again →
                    </Link>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>

      {registerTarget && (
        <RegisterTrialDialog
          trial={registerTarget}
          profile={profile}
          onClose={() => setRegisterTarget(null)}
          onRegistered={(reg) => setRegistrations((prev) => [reg, ...prev])}
        />
      )}
    </div>
  );
}
