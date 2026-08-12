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

export default function PatientProfile({ profile }: { profile: Profile }) {
  if (!profile) return null;

  const items = [
    { label: "Age", value: profile.age ?? "Unknown" },
    { label: "Sex", value: profile.sex ?? "Unknown" },
    { label: "Location", value: profile.location ?? "Unknown" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]"
    >
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
        <svg width="16" height="16" fill="none" stroke="var(--accent)" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Extracted Patient Profile
      </h3>

      <div className="grid grid-cols-3 gap-3 mb-3">
        {items.map((item) => (
          <div key={item.label} className="p-2 rounded-lg bg-[var(--bg-primary)]/60">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
              {item.label}
            </div>
            <div className="text-sm font-medium text-[var(--text-primary)]">
              {String(item.value)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {profile.conditions?.map((c) => (
          <span
            key={c}
            className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300"
          >
            {c}
          </span>
        ))}
        {profile.symptoms?.map((s) => (
          <span
            key={s}
            className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300"
          >
            {s}
          </span>
        ))}
        {profile.medications?.map((m) => (
          <span
            key={m}
            className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300"
          >
            {m}
          </span>
        ))}
        {Object.entries(profile.lab_values || {}).map(([k, v]) => (
          <span
            key={k}
            className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
          >
            {k}: {v}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
