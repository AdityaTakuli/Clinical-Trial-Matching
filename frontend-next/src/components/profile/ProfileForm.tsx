"use client";

import { useState } from "react";
import TagInput from "@/components/profile/TagInput";
import { Profile, ProfileInput, Sex, deleteProfile, saveProfile } from "@/lib/client";

const CONDITION_SUGGESTIONS = ["Type 2 diabetes", "Hypertension", "Asthma", "Chronic kidney disease", "Heart failure", "COPD"];
const MEDICATION_SUGGESTIONS = ["Metformin", "Insulin", "Lisinopril", "Atorvastatin", "Albuterol"];
const LAB_SUGGESTIONS = ["HbA1c", "BMI", "eGFR", "Creatinine", "LDL"];

type LabRow = { key: string; value: string };

function toInput(profile: Profile | null): ProfileInput {
  return {
    full_name: profile?.full_name ?? "",
    date_of_birth: profile?.date_of_birth ?? "",
    sex: profile?.sex ?? null,
    phone: profile?.phone ?? "",
    city: profile?.city ?? "",
    country: profile?.country ?? "",
    conditions: profile?.conditions ?? [],
    medications: profile?.medications ?? [],
    allergies: profile?.allergies ?? [],
    medical_history: profile?.medical_history ?? [],
    lab_values: profile?.lab_values ?? {},
    notes: profile?.notes ?? "",
    contact_consent: profile?.contact_consent ?? false,
  };
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section data-reveal className="grid md:grid-cols-[200px_1fr] gap-3 md:gap-8 py-6 border-t border-[var(--border)] first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-sm font-medium text-[var(--text-primary)]">{title}</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed">{hint}</p>
      </div>
      <div className="space-y-4 min-w-0">{children}</div>
    </section>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

interface ProfileFormProps {
  initial: Profile | null;
  onSaved: (profile: Profile | null) => void;
}

export default function ProfileForm({ initial, onSaved }: ProfileFormProps) {
  const [form, setForm] = useState<ProfileInput>(() => toInput(initial));
  const [labs, setLabs] = useState<LabRow[]>(() =>
    Object.entries(initial?.lab_values ?? {}).map(([key, value]) => ({ key, value: String(value) }))
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setStatus(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    const lab_values: Record<string, number> = {};
    for (const row of labs) {
      const value = Number(row.value);
      if (row.key.trim() && row.value.trim() && Number.isFinite(value)) lab_values[row.key.trim()] = value;
    }

    try {
      const saved = await saveProfile({
        ...form,
        date_of_birth: form.date_of_birth || null,
        lab_values,
      });
      onSaved(saved);
      setStatus({ kind: "ok", text: "Profile saved" });
    } catch (err) {
      setStatus({ kind: "err", text: err instanceof Error ? err.message : "Couldn't save profile" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await deleteProfile();
      setForm(toInput(null));
      setLabs([]);
      setConfirmDelete(false);
      onSaved(null);
      setStatus({ kind: "ok", text: "Profile deleted" });
    } catch (err) {
      setStatus({ kind: "err", text: err instanceof Error ? err.message : "Couldn't delete profile" });
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={submit}>
      <Section title="Personal details" hint="Your name is required to register interest in trials.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field id="full_name" label="Full name">
            <input id="full_name" className="field" value={form.full_name ?? ""} maxLength={120} onChange={(e) => set("full_name", e.target.value)} placeholder="Jane Doe" autoComplete="name" />
          </Field>
          <Field id="dob" label="Date of birth">
            <input id="dob" type="date" className="field" value={form.date_of_birth ?? ""} max={today} min="1900-01-01" onChange={(e) => set("date_of_birth", e.target.value)} />
          </Field>
          <Field id="phone" label="Phone (optional)">
            <input id="phone" type="tel" className="field" value={form.phone ?? ""} maxLength={32} onChange={(e) => set("phone", e.target.value)} placeholder="+1 555 010 2030" autoComplete="tel" />
          </Field>
          <div>
            <span className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Sex</span>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
              {(["FEMALE", "MALE", "OTHER"] as Sex[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => set("sex", form.sex === option ? null : option)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    form.sex === option
                      ? "bg-[var(--accent)] text-white shadow-[0_4px_14px_-6px_var(--accent-glow)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {option.charAt(0) + option.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Location" hint="Used to prioritise trial sites near you.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field id="city" label="City">
            <input id="city" className="field" value={form.city ?? ""} maxLength={120} onChange={(e) => set("city", e.target.value)} placeholder="Boston" autoComplete="address-level2" />
          </Field>
          <Field id="country" label="Country">
            <input id="country" className="field" value={form.country ?? ""} maxLength={120} onChange={(e) => set("country", e.target.value)} placeholder="United States" autoComplete="country-name" />
          </Field>
        </div>
      </Section>

      <Section title="Health information" hint="Press Enter or comma to add each item. Only share what you're comfortable with.">
        <TagInput id="conditions" label="Conditions" values={form.conditions} onChange={(v) => set("conditions", v)} placeholder="e.g. Type 2 diabetes" suggestions={CONDITION_SUGGESTIONS} />
        <TagInput id="medications" label="Current medications" values={form.medications} onChange={(v) => set("medications", v)} placeholder="e.g. Metformin" suggestions={MEDICATION_SUGGESTIONS} />
        <div className="grid sm:grid-cols-2 gap-4">
          <TagInput id="allergies" label="Allergies" values={form.allergies} onChange={(v) => set("allergies", v)} placeholder="e.g. Penicillin" />
          <TagInput id="history" label="Past medical history" values={form.medical_history} onChange={(v) => set("medical_history", v)} placeholder="e.g. Appendectomy 2015" />
        </div>
      </Section>

      <Section title="Lab values" hint="Recent results help match eligibility thresholds like HbA1c or eGFR.">
        <div className="space-y-2">
          {labs.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_110px_auto] gap-2">
              <input
                aria-label="Lab name"
                className="field"
                value={row.key}
                maxLength={40}
                list="lab-suggestions"
                placeholder="HbA1c"
                onChange={(e) => setLabs((prev) => prev.map((r, j) => (j === i ? { ...r, key: e.target.value } : r)))}
              />
              <input
                aria-label="Lab value"
                className="field"
                inputMode="decimal"
                value={row.value}
                placeholder="7.2"
                onChange={(e) => setLabs((prev) => prev.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))}
              />
              <button
                type="button"
                aria-label="Remove lab value"
                onClick={() => setLabs((prev) => prev.filter((_, j) => j !== i))}
                className="w-10 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/40 transition-colors"
              >
                ×
              </button>
            </div>
          ))}
          <datalist id="lab-suggestions">
            {LAB_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={() => setLabs((prev) => [...prev, { key: "", value: "" }])}
            className="text-xs px-3 py-1.5 rounded-full border border-dashed border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--accent-light)] hover:border-[var(--accent)] transition-colors"
          >
            + Add lab value
          </button>
        </div>
      </Section>

      <Section title="Notes & consent" hint="Anything else a study team or the assistant should know.">
        <Field id="notes" label="Notes">
          <textarea id="notes" rows={3} maxLength={4000} className="field resize-none" value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="e.g. Prefer trials within 50 km, can't travel on weekdays" />
        </Field>
        <label className="flex items-start gap-3 text-sm text-[var(--text-secondary)] cursor-pointer">
          <input type="checkbox" checked={form.contact_consent} onChange={(e) => set("contact_consent", e.target.checked)} className="mt-0.5 w-4 h-4 accent-[var(--accent)] shrink-0" />
          I&apos;m happy to be contacted about new trials that match my profile.
        </label>
      </Section>

      <div data-reveal className="sticky bottom-3 z-10 mt-4">
        <div className="glass !border rounded-2xl border-[var(--border)] px-4 py-3 flex flex-wrap items-center gap-3 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.5)]">
          {initial && (
            <button
              type="button"
              onClick={remove}
              onBlur={() => setConfirmDelete(false)}
              className="text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors"
            >
              {confirmDelete ? "Click again to delete profile" : "Delete profile"}
            </button>
          )}
          {status && (
            <span role="status" className={`text-sm ${status.kind === "ok" ? "text-emerald-500" : "text-[var(--danger)]"}`}>
              {status.kind === "ok" ? "✓ " : ""}
              {status.text}
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="btn-primary ml-auto px-6 py-2.5 rounded-full text-sm font-medium disabled:opacity-60"
          >
            {saving ? "Saving…" : initial ? "Save changes" : "Create profile"}
          </button>
        </div>
      </div>
    </form>
  );
}
