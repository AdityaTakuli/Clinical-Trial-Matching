"use client";

import { KeyboardEvent, useState } from "react";

interface TagInputProps {
  id: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}

export default function TagInput({
  id,
  label,
  values,
  onChange,
  placeholder,
  suggestions = [],
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const value = raw.trim().replace(/,$/, "").trim();
    if (value && !values.some((v) => v.toLowerCase() === value.toLowerCase())) {
      onChange([...values, value]);
    }
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  const remaining = suggestions
    .filter((s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()))
    .slice(0, 5);

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
        {label}
      </label>
      <div className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] px-2 py-1.5 flex flex-wrap items-center gap-1.5 min-h-[46px] transition-[border-color,box-shadow] focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_var(--accent-soft)]">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1 max-w-full text-xs pl-2.5 pr-1 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--accent)]/25 text-[var(--accent-light)]"
          >
            <span className="truncate">{value}</span>
            <button
              type="button"
              aria-label={`Remove ${value}`}
              onClick={() => onChange(values.filter((v) => v !== value))}
              className="w-4 h-4 rounded-full inline-flex items-center justify-center hover:bg-[var(--accent)] hover:text-white transition-colors"
            >
              <svg width="8" height="8" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.8">
                <path d="M2 2l6 6M8 2L2 8" />
              </svg>
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={values.length ? "Add more…" : placeholder}
          className="flex-1 min-w-[110px] bg-transparent outline-none text-sm px-1.5 py-1 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
      </div>
      {remaining.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {remaining.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-[var(--border-strong)] text-[var(--text-muted)] hover:text-[var(--accent-light)] hover:border-[var(--accent)] transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
