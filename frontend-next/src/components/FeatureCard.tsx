"use client";

import { motion } from "framer-motion";
import { ReactNode, useRef } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  delay?: number;
}

export default function FeatureCard({
  icon,
  title,
  description,
  delay = 0,
}: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Cursor-following spotlight
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="card group relative p-5 sm:p-6 rounded-2xl overflow-hidden"
    >
      {/* Spotlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(320px circle at var(--mx) var(--my), rgba(47,116,255,0.08), transparent 60%)",
        }}
      />
      <div className="relative z-10">
        <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-[var(--border)] flex items-center justify-center mb-5 text-[var(--text-secondary)] group-hover:text-[var(--accent-light)] group-hover:border-[var(--accent)]/40 transition-colors">
          {icon}
        </div>
        <h3 className="text-[1.05rem] font-medium text-[var(--text-primary)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
