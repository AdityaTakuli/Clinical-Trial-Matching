"use client";

import { motion } from "framer-motion";

interface Profile {
  age: number | null;
  sex: string | null;
  location: string | null;
  conditions: string[];
  symptoms: string[];
  medications: string[];
  lab_values: Record<string, number>;
  medical_history: string[];
}

function Chip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
        accent
          ? "bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent-light)]"
          : "bg-white/[0.04] border-[var(--border)] text-[var(--text-secondary)]"
      }`}
    >
      {label}
    </span>
  );
}

export default function PatientProfile({ profile }: { profile: Profile }) {
  if (!profile) return null;

  const items = [
    { label: "Age", value: profile.age ?? "—" },
    { label: "Sex", value: profile.sex ?? "—" },
    { label: "Location", value: profile.location ?? "—" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card p-4 sm:p-5 rounded-2xl min-w-0"
    >
      <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <svg width="16" height="16" fill="none" stroke="var(--accent-light)" strokeWidth="1.75" viewBox="0 0 24 24" className="shrink-0">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Extracted Patient Profile
      </h3>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="p-2.5 sm:p-3 rounded-xl bg-white/[0.02] border border-[var(--border)] min-w-0"
          >
            <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
              {item.label}
            </div>
            <div className="text-xs sm:text-sm font-medium text-[var(--text-primary)] mt-0.5 truncate">
              {String(item.value)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {profile.conditions?.map((c) => (
          <Chip key={c} label={c} />
        ))}
        {profile.symptoms?.map((s) => (
          <Chip key={s} label={s} />
        ))}
        {profile.medications?.map((m) => (
          <Chip key={m} label={m} />
        ))}
        {Object.entries(profile.lab_values || {}).map(([k, v]) => (
          <Chip key={k} label={`${k}: ${v}`} accent />
        ))}
      </div>
    </motion.div>
  );
}
