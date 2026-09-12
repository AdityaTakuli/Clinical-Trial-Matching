"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { Profile, Registration, registerForTrial } from "@/lib/client";

interface RegisterTrialDialogProps {
  trial: { nct_id: string; title?: string | null };
  profile: Profile | null;
  onClose: () => void;
  onRegistered: (registration: Registration) => void;
}

export default function RegisterTrialDialog({
  trial,
  profile,
  onClose,
  onRegistered,
}: RegisterTrialDialogProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [contact, setContact] = useState<"EMAIL" | "PHONE">("EMAIL");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const profileReady = !!profile?.full_name;

  const close = () => {
    if (prefersReducedMotion() || !rootRef.current) return onClose();
    gsap.to(rootRef.current, { opacity: 0, duration: 0.18, onComplete: onClose });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".dlg-backdrop", { opacity: 0, duration: 0.25 });
      gsap.from(".dlg-panel", { y: 28, scale: 0.97, opacity: 0, duration: 0.5, ease: "power3.out" });
      gsap.from(".dlg-item", { y: 10, opacity: 0, stagger: 0.05, delay: 0.12, duration: 0.4, ease: "power2.out" });
    },
    { scope: rootRef }
  );

  useGSAP(
    () => {
      if (!done || prefersReducedMotion()) return;
      gsap.from(".dlg-success-icon", { scale: 0, rotate: -45, duration: 0.6, ease: "back.out(2)" });
      gsap.from(".dlg-success-text", { y: 12, opacity: 0, stagger: 0.08, delay: 0.15, duration: 0.45 });
    },
    { scope: rootRef, dependencies: [done] }
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const registration = await registerForTrial(trial.nct_id, {
        title: trial.title ?? undefined,
        preferred_contact: contact,
        message: message.trim() || undefined,
      });
      onRegistered(registration);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const summary = profile
    ? [
        ["Name", profile.full_name],
        ["Age", profile.age != null ? `${profile.age}` : null],
        ["Location", [profile.city, profile.country].filter(Boolean).join(", ") || null],
        ["Conditions", profile.conditions.join(", ") || null],
      ]
    : [];

  return createPortal(
    <div ref={rootRef} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="dlg-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-dialog-title"
        className="dlg-panel card card-glow relative w-full sm:max-w-lg max-h-[92svh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 bg-[var(--bg-card)]"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full inline-flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {done ? (
          <div className="text-center py-4">
            <div className="dlg-success-icon mx-auto w-16 h-16 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-[0_0_0_8px_var(--accent-soft),0_12px_32px_-8px_var(--accent-glow)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5L20 7" />
              </svg>
            </div>
            <h2 className="dlg-success-text mt-6 text-xl font-semibold text-[var(--text-primary)]">
              Interest registered
            </h2>
            <p className="dlg-success-text mt-2 text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
              {trial.nct_id} is now tracked in your profile. The study team makes the final
              eligibility decision, so keep your profile up to date.
            </p>
            <div className="dlg-success-text mt-6 flex flex-col sm:flex-row gap-2 justify-center">
              <Link
                href="/profile?tab=registrations"
                className="btn-primary inline-flex justify-center px-5 py-2.5 rounded-full text-sm font-medium"
              >
                View my registrations
              </Link>
              <button type="button" onClick={close} className="btn-ghost px-5 py-2.5 rounded-full text-sm">
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="dlg-item pr-8">
              <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--accent-light)]">
                Register interest
              </span>
              <h2 id="register-dialog-title" className="mt-2 text-lg font-semibold leading-snug text-[var(--text-primary)] line-clamp-3">
                {trial.title || trial.nct_id}
              </h2>
              <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)] font-mono">
                {trial.nct_id}
              </span>
            </div>

            {!profileReady ? (
              <div className="dlg-item mt-6 p-4 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/25">
                <p className="text-sm font-medium text-[var(--text-primary)]">Create your profile first</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Registering shares your basic details with this request, so we need at least your
                  name. It only takes a minute.
                </p>
                <Link
                  href="/profile"
                  className="btn-primary mt-4 inline-flex px-4 py-2 rounded-full text-sm font-medium"
                >
                  Create profile →
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-5">
                <div className="dlg-item rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
                      Shared from your profile
                    </span>
                    <Link href="/profile" className="text-xs text-accent hover:underline">
                      Edit
                    </Link>
                  </div>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                    {summary.map(([label, value]) => (
                      <div key={label} className="contents">
                        <dt className="text-[var(--text-muted)]">{label}</dt>
                        <dd className="text-[var(--text-primary)] truncate">{value || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <fieldset className="dlg-item">
                  <legend className="text-xs font-medium text-[var(--text-secondary)] mb-2">
                    Preferred contact
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(["EMAIL", "PHONE"] as const).map((option) => {
                      const disabled = option === "PHONE" && !profile?.phone;
                      const active = contact === option;
                      return (
                        <label
                          key={option}
                          className={`relative flex flex-col gap-0.5 rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${
                            disabled
                              ? "opacity-50 cursor-not-allowed border-[var(--border)]"
                              : active
                                ? "cursor-pointer border-[var(--accent)] bg-[var(--accent-soft)]"
                                : "cursor-pointer border-[var(--border)] hover:border-[var(--border-strong)]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="contact"
                            value={option}
                            checked={active}
                            disabled={disabled}
                            onChange={() => setContact(option)}
                            className="sr-only"
                          />
                          <span className="font-medium text-[var(--text-primary)]">
                            {option === "EMAIL" ? "Email" : "Phone"}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] truncate">
                            {option === "PHONE" ? profile?.phone || "Add a phone in your profile" : "Your account email"}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="dlg-item">
                  <label htmlFor="register-message" className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    Note for the study team <span className="text-[var(--text-muted)]">(optional)</span>
                  </label>
                  <textarea
                    id="register-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={2000}
                    rows={3}
                    placeholder="e.g. Best time to reach me, questions about travel…"
                    className="field resize-none"
                  />
                </div>

                <label className="dlg-item flex items-start gap-3 text-sm text-[var(--text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[var(--accent)] shrink-0"
                  />
                  I agree that TrialMatch stores this registration together with the profile details above.
                </label>

                {error && (
                  <p className="text-sm text-[var(--danger)]" role="alert">
                    {error}
                  </p>
                )}

                <div className="dlg-item flex flex-col-reverse sm:flex-row sm:items-center gap-3">
                  <a
                    href={`https://clinicaltrials.gov/study/${trial.nct_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-center sm:text-left"
                  >
                    Contact the site directly ↗
                  </a>
                  <button
                    type="submit"
                    disabled={!consent || submitting}
                    className="btn-primary sm:ml-auto px-5 py-2.5 rounded-full text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Registering…" : "Register interest"}
                  </button>
                </div>

                <p className="dlg-item text-[11px] leading-relaxed text-[var(--text-muted)]">
                  Registering records your interest in TrialMatch. It is not enrollment; the study
                  team confirms eligibility.
                </p>
              </form>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
