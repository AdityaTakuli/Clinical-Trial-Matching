"use client";

import { motion } from "framer-motion";

interface Trial {
  nct_id: string;
  title: string;
  matched_condition: string;
  score: number;
  eligibility_score: number;
  eligibility_status: string;
  condition_similarity: number;
  location_score: number;
  match_reasons: string[];
  unknown_information: string[];
  potential_conflicts: string[];
  eligibility_explanation: string;
  locations: { facility: string; city: string; country: string }[];
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    STRONG_MATCH: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      label: "Strong Match",
    },
    UNCERTAIN: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-400",
      label: "Uncertain",
    },
    POTENTIAL_MISMATCH: {
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-400",
      label: "Potential Mismatch",
    },
  }[status] || {
    bg: "bg-gray-500/10",
    border: "border-gray-500/30",
    text: "text-gray-400",
    label: status,
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.border} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

function ScoreRing({ value, label, color }: { value: number; label: string; color: string }) {
  const percentage = Math.round(value * 100);
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="var(--border)"
            strokeWidth="3"
          />
          <motion.circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--text-primary)]">
          {percentage}
        </span>
      </div>
      <span className="text-[10px] text-[var(--text-secondary)]">{label}</span>
    </div>
  );
}

export default function TrialCard({
  trial,
  index,
}: {
  trial: Trial;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -2 }}
      className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all group"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent-light)] font-mono">
              {trial.nct_id}
            </span>
            <StatusBadge status={trial.eligibility_status} />
          </div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] leading-snug line-clamp-2">
            {trial.title}
          </h3>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-2xl font-bold gradient-text">
            {Math.round((trial.score || 0) * 100)}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)]">
            Match Score
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
          {trial.matched_condition}
        </span>
        {trial.locations?.[0] && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">
            📍 {trial.locations[0].city}, {trial.locations[0].country}
          </span>
        )}
      </div>

      {/* Score Rings */}
      <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-[var(--bg-primary)]/50">
        <ScoreRing
          value={trial.condition_similarity || 0}
          label="Condition"
          color="#8b5cf6"
        />
        <ScoreRing
          value={trial.eligibility_score || 0}
          label="Eligibility"
          color="#10b981"
        />
        <ScoreRing
          value={trial.location_score || 0}
          label="Location"
          color="#3b82f6"
        />
      </div>

      {/* Match Reasons */}
      {trial.match_reasons?.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-emerald-400 mb-1.5">
            ✓ Why this matched
          </div>
          <ul className="space-y-1">
            {trial.match_reasons.slice(0, 3).map((reason, i) => (
              <li
                key={i}
                className="text-xs text-[var(--text-secondary)] pl-3 border-l-2 border-emerald-500/30"
              >
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Potential Conflicts */}
      {trial.potential_conflicts?.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-red-400 mb-1.5">
            ⚠ Potential conflicts
          </div>
          <ul className="space-y-1">
            {trial.potential_conflicts.slice(0, 2).map((conflict, i) => (
              <li
                key={i}
                className="text-xs text-[var(--text-secondary)] pl-3 border-l-2 border-red-500/30"
              >
                {conflict}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Eligibility Explanation */}
      {trial.eligibility_explanation && (
        <details className="mt-3 group/details">
          <summary className="text-xs font-medium text-[var(--accent-light)] cursor-pointer hover:text-[var(--accent)] transition-colors">
            View eligibility details →
          </summary>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed p-3 rounded-lg bg-[var(--bg-primary)]/50 whitespace-pre-line"
          >
            {trial.eligibility_explanation}
          </motion.p>
        </details>
      )}
    </motion.article>
  );
}
