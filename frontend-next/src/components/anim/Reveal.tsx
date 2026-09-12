"use client";

import { ReactNode, useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";

/**
 * Fades + lifts every `[data-reveal]` descendant (or the wrapper itself when
 * there are none) with a stagger. `onScroll` defers it until in view.
 */
export default function Reveal({
  children,
  as = "div",
  className,
  onScroll = false,
  stagger = 0.08,
  y = 24,
  delay = 0,
}: {
  children: ReactNode;
  as?: "div" | "section" | "header" | "ul";
  className?: string;
  onScroll?: boolean;
  stagger?: number;
  y?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // All allowed tags are plain block elements, so a div ref type fits them all
  const Tag = as as "div";

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || prefersReducedMotion()) return;

      const items = root.querySelectorAll<HTMLElement>("[data-reveal]");
      const targets = items.length ? Array.from(items) : [root];

      gsap.from(targets, {
        y,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger,
        delay,
        clearProps: "transform,opacity",
        scrollTrigger: onScroll ? { trigger: root, start: "top 85%", once: true } : undefined,
      });
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
