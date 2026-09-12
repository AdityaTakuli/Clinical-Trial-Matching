"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import type { Trial } from "@/lib/client";

function StatusBadge({ status }: { status: string }) {
  const config = {
    STRONG_MATCH: {
      bg: "bg-emerald-500/[0.08]",
      border: "border-emerald-500/25",
      text: "text-emerald-500 dark:text-emerald-300",
      label: "Strong Match",
    },
    UNCERTAIN: {
      bg: "bg-amber-500/[0.08]",
      border: "border-amber-500/25",
      text: "text-amber-600 dark:text-amber-300",
      label: "Uncertain",
    },
    POTENTIAL_MISMATCH: {
      bg: "bg-red-500/[0.08]",
      border: "border-red-500/25",
      text: "text-red-500 dark:text-red-300",
      label: "Potential Mismatch",
    },
  }[status] || {
    bg: "bg-[var(--surface-hover)]",
    border: "border-[var(--border)]",
    text: "text-[var(--text-secondary)]",
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
          <circle cx="20" cy="20" r="18" fill="none" stroke="var(--border)" strokeWidth="3" />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
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

function ActionButton({
  onClick,
  active,
  disabled,
  highlight,
  icon,
  children,
}: {
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  highlight?: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  if (!onClick) return null;
  const tone = highlight
    ? "bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent-light)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)]"
    : active
      ? "bg-[var(--accent)] border-[var(--accent)] text-white"
      : "border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]";

  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.94 }}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors disabled:cursor-default ${tone}`}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
      {children}
    </motion.button>
  );
}

interface TrialCardProps {
  trial: Trial;
  index: number;
  saved?: boolean;
  registered?: boolean;
  asking?: boolean;
  onToggleSave?: () => void;
  onRegister?: () => void;
  onAsk?: () => void;
}

export default function TrialCard({
  trial,
  index,
  saved,
  registered,
  asking,
  onToggleSave,
  onRegister,
  onAsk,
}: TrialCardProps) {
  const hasActions = onAsk || onToggleSave || onRegister;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 3) * 0.05 }}
      className="card p-4 sm:p-6 rounded-2xl group min-w-0 lg:hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)] font-mono">
              {trial.nct_id}
            </span>
            <StatusBadge status={trial.eligibility_status} />
            {registered && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--accent)]/25 text-[var(--accent-light)]">
                Registered
              </span>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-medium text-[var(--text-primary)] leading-snug line-clamp-3 sm:line-clamp-2">
            {trial.title}
          </h3>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] tabular-nums">
            {Math.round((trial.score || 0) * 100)}
          </div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Match Score
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--accent)]/25 text-[var(--accent-light)]">
          {trial.matched_condition}
        </span>
        {trial.locations?.[0] && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)]">
            {[trial.locations[0].city, trial.locations[0].country].filter(Boolean).join(", ")}
          </span>
        )}
      </div>

      {/* Score Rings */}
      <div className="flex items-center justify-around sm:justify-start gap-3 sm:gap-4 mb-4 p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] overflow-x-auto">
        <ScoreRing value={trial.condition_similarity || 0} label="Condition" color="#2f74ff" />
        <ScoreRing value={trial.eligibility_score || 0} label="Eligibility" color="#5b95ff" />
        <ScoreRing value={trial.location_score || 0} label="Location" color="#38bdf8" />
      </div>

      {/* Match Reasons */}
      {trial.match_reasons?.length > 0 && (
        <div className="mb-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-emerald-500/90 dark:text-emerald-300/80 mb-2">
            Why this matched
          </div>
          <ul className="space-y-1.5">
            {trial.match_reasons.slice(0, 3).map((reason, i) => (
              <li key={i} className="text-xs text-[var(--text-secondary)] pl-3 border-l border-emerald-500/40">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Potential Conflicts */}
      {trial.potential_conflicts?.length > 0 && (
        <div className="mb-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-red-500/90 dark:text-red-300/80 mb-2">
            Potential conflicts
          </div>
          <ul className="space-y-1.5">
            {trial.potential_conflicts.slice(0, 2).map((conflict, i) => (
              <li key={i} className="text-xs text-[var(--text-secondary)] pl-3 border-l border-red-500/40">
                {conflict}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Eligibility Explanation */}
      {trial.eligibility_explanation && (
        <details className="mt-3 group/details">
          <summary className="text-xs font-medium text-[var(--accent-light)] cursor-pointer hover:text-[var(--text-primary)] transition-colors list-none">
            View eligibility details →
          </summary>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed p-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] whitespace-pre-line"
          >
            {trial.eligibility_explanation}
          </motion.p>
        </details>
      )}

      {hasActions && (
        <div
          className="mt-4 pt-4 border-t border-[var(--border)] flex flex-wrap items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <ActionButton
            onClick={onAsk}
            highlight
            disabled={asking}
            icon={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />}
          >
            {asking ? "Opening…" : "Ask AI"}
          </ActionButton>
          <ActionButton
            onClick={onToggleSave}
            active={saved}
            icon={<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill={saved ? "currentColor" : "none"} />}
          >
            {saved ? "Saved" : "Save"}
          </ActionButton>
          <ActionButton
            onClick={registered ? undefined : onRegister}
            icon={<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6" />}
          >
            Register interest
          </ActionButton>
          <a
            href={`https://clinicaltrials.gov/study/${trial.nct_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            ClinicalTrials.gov ↗
          </a>
        </div>
      )}
    </motion.article>
  );
}
