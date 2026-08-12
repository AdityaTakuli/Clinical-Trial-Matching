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
  const [focused, setFocused] = useState(false);

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
      <div
        className={`relative rounded-2xl transition-all duration-300 ${
          focused ? "shadow-[0_0_0_1px_var(--accent),0_8px_40px_-8px_var(--accent-glow)]" : ""
        }`}
      >
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Describe the patient profile — age, sex, conditions, medications, lab values, location…"
          rows={4}
          className="w-full p-5 pr-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-transparent transition-all resize-none"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit(e);
          }}
        />
        <motion.button
          type="submit"
          disabled={loading || !query.trim()}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="btn-primary absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
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
        </motion.button>
      </div>

      <div className="mt-5">
        <span className="text-xs text-[var(--text-muted)] uppercase tracking-[0.15em]">
          Try an example
        </span>
        <div className="flex flex-wrap gap-2 mt-3">
          {EXAMPLE_QUERIES.map((example, i) => (
            <motion.button
              key={i}
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setQuery(example)}
              className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)] transition-all"
            >
              {example.slice(0, 46)}…
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-[var(--border)]">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.9,
                      delay: i * 0.15,
                    }}
                    className="w-1.5 h-1.5 rounded-full bg-[var(--accent-light)]"
                  />
                ))}
              </div>
              <span className="text-sm text-[var(--text-secondary)]">
                Analyzing profile &amp; searching trials…
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  );
}
