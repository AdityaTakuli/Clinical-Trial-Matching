"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import SearchForm from "@/components/SearchForm";
import TrialCard from "@/components/TrialCard";
import PatientProfile from "@/components/PatientProfile";
import RegisterTrialDialog from "@/components/RegisterTrialDialog";
import Reveal from "@/components/anim/Reveal";
import { useAuthToken } from "@/hooks/useAuth";
import {
  ApiError,
  Profile,
  Trial,
  apiRequest,
  createChatSession,
  getProfile,
  listRegistrations,
  listSavedTrials,
  profileToQuery,
  saveTrial,
  unsaveTrial,
} from "@/lib/client";

const TrialComparisonChart = dynamic(
  () => import("@/components/ResultsChart").then((m) => m.TrialComparisonChart),
  { ssr: false }
);
const MatchRadar = dynamic(
  () => import("@/components/ResultsChart").then((m) => m.MatchRadar),
  { ssr: false }
);

interface SearchResult {
  query: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patient_profile: any;
  matched_conditions: { condition: string; similarity: number }[];
  trials: Trial[];
  disclaimer: string;
}

function withMember(set: Set<string>, id: string, present: boolean): Set<string> {
  const next = new Set(set);
  if (present) next.add(id);
  else next.delete(id);
  return next;
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = useAuthToken();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrial, setSelectedTrial] = useState<number>(0);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [registerTarget, setRegisterTarget] = useState<Trial | null>(null);
  const [askingKey, setAskingKey] = useState<string | null>(null);
  const autoRan = useRef(false);

  const redirectIfUnauthorized = (err: unknown) => {
    if (err instanceof ApiError && err.status === 401) {
      router.push("/login?next=/search");
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const wantsProfile = params.get("useProfile") === "1";

    Promise.allSettled([getProfile(), listSavedTrials(), listRegistrations()]).then(
      ([p, s, r]) => {
        if (cancelled) return;
        if (p.status === "fulfilled") {
          setProfile(p.value);
          const loaded = p.value;
          if (wantsProfile && loaded) setQuery((q) => q || profileToQuery(loaded));
        }
        if (s.status === "fulfilled") setSavedIds(new Set(s.value.map((x) => x.nct_id)));
        if (r.status === "fulfilled") setRegisteredIds(new Set(r.value.map((x) => x.nct_id)));
      }
    );

    return () => {
      cancelled = true;
    };
  }, [token, params]);

  const handleSearch = async (text: string) => {
    if (!token) {
      router.push("/login?next=/search");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiRequest<SearchResult>("/search-trials", {
        method: "POST",
        json: { query: text },
      });
      setResult(data);
      setSelectedTrial(0);
    } catch (err) {
      if (!redirectIfUnauthorized(err)) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  // Re-run a search passed in the URL (e.g. "Run again" from search history)
  useEffect(() => {
    const q = params.get("q");
    if (autoRan.current || !token || !q) return;
    autoRan.current = true;
    handleSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, params]);

  const toggleSave = async (trial: Trial) => {
    const wasSaved = savedIds.has(trial.nct_id);
    setSavedIds((prev) => withMember(prev, trial.nct_id, !wasSaved));
    try {
      if (wasSaved) await unsaveTrial(trial.nct_id);
      else await saveTrial(trial.nct_id, trial.title);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 409 || err.status === 404)) return;
      setSavedIds((prev) => withMember(prev, trial.nct_id, wasSaved));
      if (!redirectIfUnauthorized(err)) {
        setError(err instanceof Error ? err.message : "Couldn't update saved trials");
      }
    }
  };

  const askAssistant = async (trials: Trial[], title: string, key: string, prompt?: string) => {
    if (!result) return;
    setAskingKey(key);
    try {
      const session = await createChatSession({
        title,
        context: {
          query: result.query,
          patient_profile: result.patient_profile,
          trials,
        },
      });
      const qs = new URLSearchParams({ session: String(session.id) });
      if (prompt) qs.set("prompt", prompt);
      router.push(`/chat?${qs}`);
    } catch (err) {
      setAskingKey(null);
      if (!redirectIfUnauthorized(err)) {
        setError(err instanceof Error ? err.message : "Couldn't start a conversation");
      }
    }
  };

  const profileToolbar =
    token === undefined ? null : profile ? (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setQuery(profileToQuery(profile))}
          className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-[var(--accent-soft)] border border-[var(--accent)]/30 text-[var(--accent-light)] hover:bg-[var(--accent)] hover:text-white transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Use my saved profile
        </button>
        <Link href="/profile" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          Edit profile
        </Link>
      </div>
    ) : token ? (
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-dashed border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--accent-light)] hover:border-[var(--accent)] transition-colors"
      >
        + Create a health profile for one-click searches
      </Link>
    ) : (
      <p className="text-xs text-[var(--text-muted)]">
        <Link href="/login?next=/search" className="text-accent hover:underline">
          Sign in
        </Link>{" "}
        or{" "}
        <Link href="/register" className="text-accent hover:underline">
          create an account
        </Link>{" "}
        to search, save trials and chat with the assistant.
      </p>
    );

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-12 sm:pb-16 overflow-x-hidden">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-32 right-0 sm:right-10 w-[min(360px,80vw)] h-[min(360px,80vw)] rounded-full bg-[var(--accent)]/[0.06] blur-[60px] sm:blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center mb-8 sm:mb-10" stagger={0.1}>
          <span data-reveal className="inline-block text-xs font-medium tracking-[0.2em] uppercase text-[var(--accent-light)]">
            Trial Discovery
          </span>
          <h1 data-reveal className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mt-3 mb-3 text-gradient">
            Search Clinical Trials
          </h1>
          <p data-reveal className="text-[var(--text-secondary)] text-base sm:text-lg max-w-xl mx-auto px-1">
            Describe a patient profile in natural language to find matched recruiting trials.
          </p>
        </Reveal>

        <div className="max-w-3xl mx-auto mb-12">
          <SearchForm
            onSearch={handleSearch}
            loading={loading}
            query={query}
            onQueryChange={setQuery}
            toolbar={profileToolbar}
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-3xl mx-auto mb-8 p-4 rounded-xl bg-red-500/[0.08] border border-red-500/25 text-red-500 dark:text-red-300 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <div className="mb-8">
                <PatientProfile profile={result.patient_profile} />
              </div>

              {result.matched_conditions?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card mb-8 p-4 rounded-2xl"
                >
                  <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-[0.15em] mb-3">
                    Matched Conditions
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.matched_conditions.map((c) => (
                      <span
                        key={c.condition}
                        className="text-sm px-3 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--accent)]/25 text-[var(--accent-light)]"
                      >
                        {c.condition}{" "}
                        <span className="text-[var(--text-muted)]">{Math.round(c.similarity * 100)}%</span>
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {result.trials?.length > 0 && (
                <Reveal className="mb-8">
                  <div className="card card-glow relative overflow-hidden rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[var(--accent)]/[0.12] blur-3xl pointer-events-none" />
                    <div className="relative w-11 h-11 shrink-0 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center shadow-[0_8px_24px_-8px_var(--accent-glow)]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        <path d="M8 9h8M8 13h5" />
                      </svg>
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <h2 className="font-medium text-[var(--text-primary)]">Questions about these matches?</h2>
                      <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        Chat with the TrialMatch assistant. It sees these results and your profile, so it can
                        compare trials and explain eligibility.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={askingKey !== null}
                      onClick={() =>
                        askAssistant(
                          result.trials,
                          `Trials for: ${result.query}`.slice(0, 120),
                          "all",
                          "Compare these trials and tell me which look like the best fit for me."
                        )
                      }
                      className="relative btn-primary shrink-0 inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium disabled:opacity-60"
                    >
                      {askingKey === "all" ? "Opening…" : "Chat about results →"}
                    </button>
                  </div>
                </Reveal>
              )}

              {result.trials?.length > 0 && (
                <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] gap-4 sm:gap-6">
                  <div className="space-y-4 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-base sm:text-lg font-medium text-[var(--text-primary)]">
                        {result.trials.length} Matched Trial{result.trials.length > 1 ? "s" : ""}
                      </h2>
                    </div>
                    {result.trials.map((trial, i) => (
                      <div
                        key={trial.nct_id || i}
                        onClick={() => setSelectedTrial(i)}
                        className="cursor-pointer min-w-0"
                      >
                        <TrialCard
                          trial={trial}
                          index={i}
                          saved={savedIds.has(trial.nct_id)}
                          registered={registeredIds.has(trial.nct_id)}
                          asking={askingKey === trial.nct_id}
                          onToggleSave={() => toggleSave(trial)}
                          onRegister={() => setRegisterTarget(trial)}
                          onAsk={() =>
                            askAssistant(
                              [trial],
                              `About ${trial.nct_id}`,
                              trial.nct_id,
                              "Explain this trial in simple terms. Could my profile be a good fit, and what is still unclear?"
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <div className="hidden lg:block space-y-4 lg:sticky lg:top-24 lg:self-start min-w-0">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="card p-4 rounded-2xl"
                    >
                      <h4 className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-[0.15em] mb-3">
                        Score Comparison
                      </h4>
                      <TrialComparisonChart trials={result.trials} />
                    </motion.div>

                    {result.trials[selectedTrial] && (
                      <motion.div
                        key={selectedTrial}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="card p-4 rounded-2xl"
                      >
                        <h4 className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-[0.15em] mb-3">
                          Trial #{selectedTrial + 1} Breakdown
                        </h4>
                        <MatchRadar trial={result.trials[selectedTrial]} />
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {result.trials?.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-[var(--text-secondary)]">
                    No recruiting trials matched this query. Try broadening your search.
                  </p>
                </motion.div>
              )}

              {result.disclaimer && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 text-center text-xs text-[var(--text-secondary)] max-w-xl mx-auto"
                >
                  ⚕️ {result.disclaimer}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {registerTarget && (
        <RegisterTrialDialog
          trial={registerTarget}
          profile={profile}
          onClose={() => setRegisterTarget(null)}
          onRegistered={(reg) => setRegisteredIds((prev) => withMember(prev, reg.nct_id, true))}
        />
      )}
    </div>
  );
}
