"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchFormProps {
  onSearch: (query: string) => void;
  loading: boolean;
}

const EXAMPLE_QUERIES = [
  "45 year old female with type 2 diabetes, HbA1c 8.1, BMI 31, living in Boston",
  "60 year old male with chronic kidney disease, eGFR 42, taking metformin",
  "25 year old with asthma and shortness of breath near London",
  "55 year old woman with hypertension and heart failure in Delhi",
];

export default function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="w-full"
    >
      <div className="relative">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe the patient profile... (age, sex, conditions, medications, lab values, location)"
          rows={4}
          className="w-full p-5 pr-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent)] focus:shadow-lg focus:shadow-[var(--accent-glow)] transition-all resize-none font-[family-name:var(--font-geist-sans)]"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit(e);
          }}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center hover:bg-[var(--accent-light)] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-[var(--accent-glow)]"
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </motion.div>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      <div className="mt-4">
        <span className="text-xs text-[var(--text-secondary)] mr-2">Try:</span>
        <div className="flex flex-wrap gap-2 mt-2">
          {EXAMPLE_QUERIES.map((example, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setQuery(example)}
              className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent-light)] hover:border-[var(--accent)]/40 transition-all"
            >
              {example.slice(0, 50)}...
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/20">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.8,
                      delay: i * 0.15,
                    }}
                    className="w-2 h-2 rounded-full bg-[var(--accent)]"
                  />
                ))}
              </div>
              <span className="text-sm text-[var(--accent-light)]">
                Analyzing profile & searching trials...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  );
}
