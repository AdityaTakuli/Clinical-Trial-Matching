"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Markdown from "@/components/chat/Markdown";
import { useRequireAuth } from "@/hooks/useAuth";
import { isDevAuthBypass } from "@/lib/auth";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import {
  ApiError,
  ChatContext,
  ChatMessage,
  ChatSessionSummary,
  createChatSession,
  deleteChatSession,
  getChatSession,
  listChatSessions,
  streamChatMessage,
} from "@/lib/client";
import { timeAgo } from "@/lib/utils";

type UiMessage = Omit<ChatMessage, "id"> & { id: number | string; pending?: boolean };

const GENERAL_SUGGESTIONS = [
  "What is a clinical trial, and is it safe to join?",
  "What do trial phases 1, 2, 3 and 4 mean?",
  "How does eligibility screening work?",
  "How should I talk to my doctor about joining a trial?",
];

function suggestionsFor(context: ChatContext | null): string[] {
  const trials = context?.trials ?? [];
  if (trials.length === 1) {
    return [
      `Explain ${trials[0].nct_id} in simple terms`,
      "Could my profile be a good fit? What's still unclear?",
      "What would taking part involve day to day?",
      "What should I ask the study coordinator?",
    ];
  }
  if (trials.length > 1) {
    return [
      "Compare these trials side by side",
      "Which trials look like the best fit for my profile?",
      "What potential conflicts or missing info should I know about?",
      "What should I ask before registering interest?",
    ];
  }
  return GENERAL_SUGGESTIONS;
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="h-[100svh]" />}>
      <ChatApp />
    </Suspense>
  );
}

function ChatApp() {
  const ready = useRequireAuth("/chat");
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = Number(params.get("session")) || null;

  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [context, setContext] = useState<ChatContext | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const [input, setInput] = useState(params.get("prompt") ?? "");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const skipLoadFor = useRef<number | null>(null);
  const renderedCount = useRef(0);
  const messageSeq = useRef(0);

  const fail = useCallback(
    (err: unknown, fallback: string) => {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (err instanceof ApiError && err.status === 401 && !isDevAuthBypass()) {
        router.replace("/login?next=/chat");
        return;
      }
      setError(err instanceof Error ? err.message : fallback);
    },
    [router]
  );

  const refreshSessions = useCallback(async () => {
    try {
      setSessions(await listChatSessions());
    } catch (err) {
      fail(err, "Couldn't load conversations");
    } finally {
      setSessionsLoaded(true);
    }
  }, [fail]);

  useEffect(() => {
    if (!ready) return;
    listChatSessions()
      .then(setSessions)
      .catch((err) => fail(err, "Couldn't load conversations"))
      .finally(() => setSessionsLoaded(true));
  }, [ready, fail]);

  // Starting a new conversation clears the view (adjusted during render)
  const [shownSessionId, setShownSessionId] = useState(sessionId);
  if (shownSessionId !== sessionId) {
    setShownSessionId(sessionId);
    if (sessionId === null) {
      setContext(null);
      setMessages([]);
    }
  }

  // Load the conversation named in the URL
  useEffect(() => {
    if (!ready || sessionId === null) return;
    if (skipLoadFor.current === sessionId) {
      skipLoadFor.current = null;
      return;
    }

    let cancelled = false;
    setLoadingSession(true);
    setError(null);
    renderedCount.current = 0;

    getChatSession(sessionId)
      .then((detail) => {
        if (cancelled) return;
        setContext(detail.context);
        setMessages(detail.messages);
      })
      .catch((err) => {
        if (cancelled) return;
        fail(err, "Couldn't load this conversation");
        if (err instanceof ApiError && err.status === 404) router.replace("/chat");
      })
      .finally(() => {
        if (!cancelled) setLoadingSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, sessionId, fail, router]);

  // Keep the latest message in view
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: streaming ? "auto" : "smooth" });
  }, [messages, streaming]);

  // Sidebar entrance
  useGSAP(
    () => {
      if (!sessionsLoaded || prefersReducedMotion()) return;
      gsap.from(".session-item", { x: -14, opacity: 0, stagger: 0.035, duration: 0.45, ease: "power2.out" });
    },
    { scope: rootRef, dependencies: [sessionsLoaded] }
  );

  // Animate newly rendered messages
  useGSAP(
    () => {
      const nodes = rootRef.current?.querySelectorAll<HTMLElement>("[data-msg]");
      if (!nodes) return;
      const fresh = Array.from(nodes).slice(renderedCount.current);
      renderedCount.current = nodes.length;
      if (!fresh.length || prefersReducedMotion()) return;
      gsap.from(fresh.slice(-8), {
        y: 18,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: fresh.length > 2 ? 0.04 : 0.12,
      });
    },
    { scope: rootRef, dependencies: [messages.length] }
  );

  const isEmpty = !loadingSession && messages.length === 0;

  // Empty-state hero
  useGSAP(
    () => {
      if (!isEmpty || prefersReducedMotion()) return;
      gsap.from(".empty-item", { y: 22, opacity: 0, stagger: 0.08, duration: 0.7, ease: "power3.out" });
      gsap.to(".empty-orb", { y: -10, duration: 2.6, ease: "sine.inOut", repeat: -1, yoyo: true, stagger: 0.5 });
    },
    { scope: rootRef, dependencies: [isEmpty, context], revertOnUpdate: true }
  );

  const autosize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };

  useEffect(autosize, [input]);

  const openSession = (id: number | null) => {
    abortRef.current?.abort();
    setSidebarOpen(false);
    setError(null);
    router.replace(id ? `/chat?session=${id}` : "/chat");
  };

  const removeSession = async (id: number) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    setConfirmDelete(null);
    try {
      await deleteChatSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (id === sessionId) openSession(null);
    } catch (err) {
      fail(err, "Couldn't delete conversation");
    }
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || streaming) return;

    setError(null);
    setInput("");
    const stamp = ++messageSeq.current;
    const assistantKey = `a-${stamp}`;
    const now = "";
    setMessages((prev) => [
      ...prev,
      { id: `u-${stamp}`, role: "user", content, created_at: now },
      { id: assistantKey, role: "assistant", content: "", created_at: now, pending: true },
    ]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let targetId = sessionId;
      if (targetId === null) {
        const created = await createChatSession({});
        targetId = created.id;
        skipLoadFor.current = created.id;
        router.replace(`/chat?session=${created.id}`);
      }

      await streamChatMessage(
        targetId,
        content,
        (delta) =>
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantKey ? { ...m, content: m.content + delta } : m))
          ),
        controller.signal
      );
    } catch (err) {
      fail(err, "Message failed to send");
      setMessages((prev) => prev.filter((m) => !(m.id === assistantKey && !m.content)));
    } finally {
      setMessages((prev) => prev.map((m) => (m.id === assistantKey ? { ...m, pending: false } : m)));
      setStreaming(false);
      abortRef.current = null;
      refreshSessions();
    }
  };

  const activeSession = sessions.find((s) => s.id === sessionId);
  const trials = context?.trials ?? [];

  if (!ready) return <div className="h-[100svh]" />;

  return (
    <div ref={rootRef} className="relative h-[100svh] pt-16 flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed inset-0 top-16 z-30 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={`fixed lg:static top-16 bottom-0 left-0 z-40 w-[min(300px,85vw)] lg:w-72 shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--bg-primary)] lg:bg-[var(--bg-secondary)]/60 transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-3">
          <button
            type="button"
            onClick={() => openSession(null)}
            className="btn-primary w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New conversation
          </button>
        </div>

        <div className="px-4 pt-2 pb-2 text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
          History
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {!sessionsLoaded &&
            [0, 1, 2].map((i) => (
              <div key={i} className="h-12 mx-1 rounded-xl bg-[var(--surface-subtle)] animate-pulse" />
            ))}
          {sessionsLoaded && sessions.length === 0 && (
            <p className="px-3 py-2 text-xs text-[var(--text-muted)]">
              No conversations yet. Ask anything, or start from your search results.
            </p>
          )}
          {sessions.map((s) => {
            const active = s.id === sessionId;
            return (
              <div
                key={s.id}
                className={`session-item group relative rounded-xl transition-colors ${
                  active ? "bg-[var(--surface-hover)]" : "hover:bg-[var(--surface-subtle)]"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-full bg-[var(--accent)]" />
                )}
                <button
                  type="button"
                  onClick={() => openSession(s.id)}
                  className="w-full text-left pl-3 pr-9 py-2.5"
                >
                  <span
                    className={`block text-sm truncate ${
                      active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {s.title}
                  </span>
                  <span className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[var(--text-muted)]">
                    {s.trial_count > 0 && (
                      <span className="text-[var(--accent-light)]">
                        {s.trial_count} trial{s.trial_count > 1 ? "s" : ""} ·
                      </span>
                    )}
                    {timeAgo(s.updated_at)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => removeSession(s.id)}
                  onBlur={() => setConfirmDelete(null)}
                  aria-label={confirmDelete === s.id ? "Confirm delete" : "Delete conversation"}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                    confirmDelete === s.id
                      ? "px-2 text-[11px] bg-red-500/15 text-red-500 opacity-100"
                      : "w-7 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100"
                  }`}
                >
                  {confirmDelete === s.id ? (
                    "Delete?"
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                    </svg>
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[var(--border)]">
          <Link
            href="/search"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            Find new trials
          </Link>
        </div>
      </aside>

      {/* Main */}
      <section className="flex-1 min-w-0 flex flex-col">
        <header className="shrink-0 flex items-center gap-3 px-4 sm:px-6 h-14 border-b border-[var(--border)]">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open conversations"
            className="lg:hidden -ml-1 w-9 h-9 rounded-full inline-flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h10M4 17h16" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-medium text-[var(--text-primary)] truncate">
              {activeSession?.title ?? (sessionId ? "Conversation" : "TrialMatch Assistant")}
            </h1>
            <p className="text-[11px] text-[var(--text-muted)] truncate">
              {trials.length > 0
                ? `Grounded in ${trials.length} trial${trials.length > 1 ? "s" : ""} and your profile`
                : "Knows your saved profile · not medical advice"}
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
            <span className={`w-1.5 h-1.5 rounded-full ${streaming ? "bg-[var(--accent-light)] animate-pulse" : "bg-emerald-400"}`} />
            {streaming ? "Thinking" : "Online"}
          </span>
        </header>

        {(context?.query || trials.length > 0) && (
          <details className="shrink-0 group border-b border-[var(--border)] bg-[var(--surface-subtle)]">
            <summary className="list-none cursor-pointer px-4 sm:px-6 py-2.5 flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <svg className="transition-transform group-open:rotate-90 shrink-0" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M9 6l6 6-6 6" />
              </svg>
              <span className="truncate">
                Context{context?.query ? `: “${context.query}”` : ""}
              </span>
            </summary>
            <div className="px-4 sm:px-6 pb-3 flex flex-wrap gap-2">
              {trials.map((t) => (
                <a
                  key={t.nct_id}
                  href={`https://clinicaltrials.gov/study/${t.nct_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t.title}
                  className="max-w-full sm:max-w-xs inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
                >
                  <span className="font-mono text-[var(--accent-light)] shrink-0">{t.nct_id}</span>
                  <span className="truncate text-[var(--text-secondary)]">{t.title}</span>
                </a>
              ))}
            </div>
          </details>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {loadingSession && (
              <div className="space-y-4">
                {[0, 1].map((i) => (
                  <div key={i} className={`h-16 rounded-2xl bg-[var(--surface-subtle)] animate-pulse ${i ? "w-2/3" : "w-1/2 ml-auto"}`} />
                ))}
              </div>
            )}

            {isEmpty && (
              <div className="relative flex flex-col items-center text-center pt-6 sm:pt-12">
                <div className="empty-item relative w-20 h-20 mb-6">
                  <div className="empty-orb absolute inset-0 rounded-full bg-[var(--accent)]/30 blur-2xl" />
                  <div className="empty-orb relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent-light)] to-[var(--accent)] text-white flex items-center justify-center shadow-[0_16px_40px_-12px_var(--accent-glow)]">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l1.9 4.8L19 9.5l-4 3.5 1.2 5.3L12 15.6 7.8 18.3 9 13 5 9.5l5.1-1.7z" />
                    </svg>
                  </div>
                </div>
                <h2 className="empty-item text-2xl sm:text-3xl font-semibold tracking-tight text-gradient">
                  {trials.length ? "Let's talk about your matches" : "How can I help today?"}
                </h2>
                <p className="empty-item mt-2 text-sm sm:text-base text-[var(--text-secondary)] max-w-md">
                  {trials.length
                    ? "Ask me to compare trials, decode eligibility criteria, or prepare questions for the study team."
                    : "Ask about clinical trials, eligibility, or next steps. I use your saved profile for context."}
                </p>
                <div className="mt-8 grid sm:grid-cols-2 gap-2.5 w-full">
                  {suggestionsFor(context).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="empty-item card group text-left rounded-2xl px-4 py-3.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/50"
                    >
                      <span className="flex items-start justify-between gap-3">
                        {s}
                        <span className="text-[var(--accent-light)] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                          →
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} data-msg className="flex justify-end">
                    <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-md bg-[var(--accent)] text-white px-4 py-2.5 text-[0.925rem] leading-relaxed whitespace-pre-wrap break-words shadow-[0_8px_24px_-12px_var(--accent-glow)]">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} data-msg className="flex gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent-light)] to-[var(--accent)] text-white text-[11px] font-semibold flex items-center justify-center">
                      TM
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      {m.content ? (
                        <>
                          <Markdown content={m.content} />
                          {m.pending && <span className="typing-caret" />}
                        </>
                      ) : (
                        <div className="flex gap-1 py-2">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-[var(--accent-light)] animate-bounce"
                              style={{ animationDelay: `${i * 0.15}s` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>

            {error && (
              <div className="mt-6 p-3 rounded-xl bg-red-500/[0.08] border border-red-500/25 text-red-500 dark:text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="shrink-0 px-4 sm:px-6 pb-4 pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="max-w-3xl mx-auto"
          >
            <div className="relative rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] transition-[border-color,box-shadow] focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_1px_var(--accent),0_8px_40px_-12px_var(--accent-glow)]">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                maxLength={4000}
                placeholder="Ask about a trial, eligibility, or next steps…"
                className="block w-full resize-none bg-transparent pl-4 pr-14 py-3.5 text-[0.95rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none max-h-[180px]"
              />
              {streaming ? (
                <button
                  type="button"
                  onClick={() => abortRef.current?.abort()}
                  aria-label="Stop generating"
                  className="absolute right-2.5 bottom-2.5 w-9 h-9 rounded-full inline-flex items-center justify-center bg-[var(--text-primary)] text-[var(--bg-primary)]"
                >
                  <span className="w-3 h-3 rounded-sm bg-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="Send message"
                  className="btn-primary absolute right-2.5 bottom-2.5 w-9 h-9 rounded-full inline-flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </button>
              )}
            </div>
            <p className="mt-2 text-center text-[11px] text-[var(--text-muted)]">
              The assistant can make mistakes and is not medical advice. Confirm eligibility with the trial site.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
