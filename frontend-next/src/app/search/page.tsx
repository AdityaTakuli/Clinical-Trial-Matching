"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SearchForm from "@/components/SearchForm";
import TrialCard from "@/components/TrialCard";
import PatientProfile from "@/components/PatientProfile";
import { TrialComparisonChart, MatchRadar } from "@/components/ResultsChart";

interface SearchResult {
  query: string;
  patient_profile: any;
  matched_conditions: any[];
  trials: any[];
  disclaimer: string;
}

export default function SearchPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrial, setSelectedTrial] = useState<number>(0);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/search-trials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Search failed");
      }

      setResult(data);
      setSelectedTrial(0);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Background effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-40 right-20 w-[300px] h-[300px] rounded-full bg-[var(--accent)]/5 blur-[100px]" />
        <div className="absolute bottom-40 left-20 w-[250px] h-[250px] rounded-full bg-purple-600/5 blur-[80px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl font-bold mb-2">
            Search Clinical Trials
          </h1>
          <p className="text-[var(--text-secondary)]">
            Describe a patient profile in natural language to find matched
            recruiting trials.
          </p>
        </motion.div>

        {/* Search Form */}
        <div className="max-w-3xl mx-auto mb-12">
          <SearchForm onSearch={handleSearch} loading={loading} />
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-3xl mx-auto mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Patient Profile */}
              <div className="mb-8">
                <PatientProfile profile={result.patient_profile} />
              </div>

              {/* Matched Conditions */}
              {result.matched_conditions?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]"
                >
                  <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Matched Conditions
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.matched_conditions.map((c: any) => (
                      <span
                        key={c.condition}
                        className="text-sm px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent-light)]"
                      >
                        {c.condition}{" "}
                        <span className="text-[var(--text-secondary)]">
                          ({Math.round(c.similarity * 100)}%)
                        </span>
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Charts + Results Grid */}
              {result.trials?.length > 0 && (
                <div className="grid lg:grid-cols-[1fr_320px] gap-6">
                  {/* Trial Cards */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-lg font-semibold">
                        {result.trials.length} Matched Trial
                        {result.trials.length > 1 ? "s" : ""}
                      </h2>
                    </div>
                    {result.trials.map((trial: any, i: number) => (
                      <div
                        key={trial.nct_id || i}
                        onClick={() => setSelectedTrial(i)}
                        className="cursor-pointer"
                      >
                        <TrialCard trial={trial} index={i} />
                      </div>
                    ))}
                  </div>

                  {/* Sidebar Charts */}
                  <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]"
                    >
                      <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
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
                        className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]"
                      >
                        <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                          Trial #{selectedTrial + 1} Breakdown
                        </h4>
                        <MatchRadar trial={result.trials[selectedTrial]} />
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {result.trials?.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-[var(--text-secondary)]">
                    No recruiting trials matched this query. Try broadening
                    your search.
                  </p>
                </motion.div>
              )}

              {/* Disclaimer */}
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
    </div>
  );
}
