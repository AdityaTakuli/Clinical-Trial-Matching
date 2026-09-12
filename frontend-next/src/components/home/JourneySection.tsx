"use client";

import Link from "next/link";
import { useRef } from "react";
import Magnetic from "@/components/anim/Magnetic";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/lib/gsap";

const STEPS = [
  {
    title: "Create your profile",
    text: "Save conditions, medications, labs and location once. Every search can reuse them in one click.",
  },
  {
    title: "Match with AI",
    text: "Semantic search and eligibility scoring surface recruiting trials that fit you, near you.",
  },
  {
    title: "Ask the assistant",
    text: "Chat about any result: compare trials, decode criteria, and prepare questions for your doctor.",
  },
  {
    title: "Register interest",
    text: "Save promising trials and register interest with the details a study team needs.",
  },
];

const PREVIEW_QUESTION = "Which of these trials fits me best?";
const PREVIEW_ANSWER =
  "Based on your profile, the metformin XR study looks closest. It recruits adults 40–65 with type 2 diabetes and has a site in Boston.";
const PREVIEW_POINTS = [
  { tone: "ok", text: "Age and condition match the inclusion criteria" },
  { tone: "warn", text: "HbA1c upper limit isn't stated. Ask the site" },
  { tone: "next", text: "Next: register interest or save for later" },
];

export default function JourneySection() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const answerEl = root.querySelector<HTMLElement>(".preview-answer");
      const animated = ".preview-q, .preview-typing, .preview-a, .preview-point";

      if (prefersReducedMotion()) {
        root.querySelectorAll(".journey-step").forEach((s) => s.classList.add("is-active"));
        gsap.set(".journey-fill", { scaleY: 1 });
        gsap.set(animated, { autoAlpha: 1 });
        gsap.set(".preview-typing", { autoAlpha: 0 });
        if (answerEl) answerEl.textContent = PREVIEW_ANSWER;
        return;
      }

      gsap.from(".journey-heading > *", {
        y: 36,
        opacity: 0,
        stagger: 0.1,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: ".journey-heading", start: "top 85%", once: true },
      });

      // Progress line fills as the steps scroll past
      gsap.fromTo(
        ".journey-fill",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: ".journey-steps", start: "top 70%", end: "bottom 55%", scrub: 0.6 },
        }
      );

      gsap.utils.toArray<HTMLElement>(".journey-step").forEach((step) => {
        ScrollTrigger.create({
          trigger: step,
          start: "top 70%",
          onEnter: () => step.classList.add("is-active"),
          onLeaveBack: () => step.classList.remove("is-active"),
        });
        gsap.from(step, {
          x: -28,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: step, start: "top 90%", once: true },
        });
      });

      gsap.from(".preview-card", {
        y: 60,
        rotateX: 12,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
        transformPerspective: 900,
        scrollTrigger: { trigger: ".preview-card", start: "top 85%", once: true },
      });

      // Looping mock conversation, only while visible
      const typed = { n: 0 };
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2, paused: true, defaults: { ease: "power3.out" } });
      tl.set(animated, { autoAlpha: 0, y: 12 })
        .call(() => {
          typed.n = 0;
          if (answerEl) answerEl.textContent = "";
        })
        .to(".preview-q", { autoAlpha: 1, y: 0, duration: 0.5 }, 0.4)
        .to(".preview-typing", { autoAlpha: 1, y: 0, duration: 0.3 }, "+=0.35")
        .to(".preview-typing", { autoAlpha: 0, duration: 0.2 }, "+=1.1")
        .to(".preview-a", { autoAlpha: 1, y: 0, duration: 0.35 })
        .to(typed, {
          n: PREVIEW_ANSWER.length,
          duration: PREVIEW_ANSWER.length * 0.02,
          ease: "none",
          onUpdate: () => {
            if (answerEl) answerEl.textContent = PREVIEW_ANSWER.slice(0, Math.round(typed.n));
          },
        })
        .to(".preview-point", { autoAlpha: 1, y: 0, stagger: 0.3, duration: 0.45 }, "+=0.2")
        .to(animated, { autoAlpha: 0, duration: 0.45 }, "+=3.2");

      ScrollTrigger.create({
        trigger: ".preview-card",
        start: "top 90%",
        end: "bottom top",
        onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
      });
    },
    { scope: ref }
  );

  return (
    <section ref={ref} className="py-16 sm:py-28 border-t border-[var(--border)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        <div>
          <div className="journey-heading max-w-xl">
            <span className="block text-xs font-medium tracking-[0.2em] uppercase text-[var(--accent-light)]">
              Your trial journey
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-semibold tracking-tight mt-3 mb-4 text-gradient">
              From profile to registration, in one place
            </h2>
            <p className="text-[var(--text-secondary)] text-base sm:text-lg">
              TrialMatch stays with you after the search, with a personal profile, an AI assistant and a
              home for every trial you care about.
            </p>
          </div>

          <ol className="journey-steps relative mt-10 sm:mt-14 space-y-8 sm:space-y-10">
            <span className="absolute left-[19px] top-2 bottom-2 w-px bg-[var(--border)]" aria-hidden />
            <span
              className="journey-fill absolute left-[19px] top-2 bottom-2 w-px origin-top bg-gradient-to-b from-[var(--accent-light)] to-[var(--accent)]"
              aria-hidden
            />
            {STEPS.map((step, i) => (
              <li key={step.title} className="journey-step relative flex gap-5">
                <span className="journey-node relative z-10 w-10 h-10 shrink-0 rounded-full border border-[var(--border-strong)] bg-[var(--bg-primary)] text-sm font-semibold text-[var(--text-muted)] flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="pt-1.5">
                  <h3 className="journey-title text-lg font-medium text-[var(--text-secondary)]">{step.title}</h3>
                  <p className="mt-1 text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-md">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-wrap gap-3 pl-[60px]">
            <Magnetic>
              <Link href="/register" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium">
                Create free profile <span aria-hidden>→</span>
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href="/chat" className="btn-ghost inline-flex px-5 py-2.5 rounded-full text-sm">
                Try the assistant
              </Link>
            </Magnetic>
          </div>
        </div>

        {/* Assistant preview */}
        <div className="lg:sticky lg:top-28">
          <div className="preview-card card card-glow relative rounded-3xl overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[var(--accent)]/[0.14] blur-3xl pointer-events-none" />
            <div className="relative flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-light)] to-[var(--accent)] text-white text-xs font-semibold flex items-center justify-center">
                TM
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">TrialMatch Assistant</p>
                <p className="text-[11px] text-[var(--text-muted)]">Example conversation · 3 trials in context</p>
              </div>
              <span className="ml-auto flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
              </span>
            </div>

            <div className="relative px-5 py-6 space-y-4 min-h-[340px]">
              <div className="preview-q flex justify-end" style={{ visibility: "hidden" }}>
                <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[var(--accent)] text-white px-4 py-2.5 text-sm">
                  {PREVIEW_QUESTION}
                </div>
              </div>

              <div className="relative">
                <div className="preview-typing absolute left-0 top-0 flex gap-1 px-4 py-3 rounded-2xl bg-[var(--surface-hover)] w-fit" style={{ visibility: "hidden" }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--accent-light)] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>

                <div className="preview-a max-w-[92%] rounded-2xl rounded-bl-md bg-[var(--surface-subtle)] border border-[var(--border)] px-4 py-3" style={{ visibility: "hidden" }}>
                  <p className="preview-answer text-sm leading-relaxed text-[var(--text-primary)] min-h-[3.8rem]" />
                  <ul className="mt-3 space-y-2">
                    {PREVIEW_POINTS.map((p) => (
                      <li key={p.text} className="preview-point flex items-start gap-2 text-xs text-[var(--text-secondary)]" style={{ visibility: "hidden" }}>
                        <span
                          className={`mt-0.5 w-4 h-4 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold ${
                            p.tone === "ok"
                              ? "bg-emerald-500/15 text-emerald-500"
                              : p.tone === "warn"
                                ? "bg-amber-500/15 text-amber-500"
                                : "bg-[var(--accent-soft)] text-[var(--accent-light)]"
                          }`}
                        >
                          {p.tone === "ok" ? "✓" : p.tone === "warn" ? "?" : "→"}
                        </span>
                        {p.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="relative px-5 pb-5">
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] pl-4 pr-1.5 py-1.5">
                <span className="flex-1 text-sm text-[var(--text-muted)] truncate">Ask a follow-up question…</span>
                <span className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
