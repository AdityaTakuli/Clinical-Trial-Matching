"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface StatProps {
  end: number;
  suffix?: string;
  label: string;
  duration?: number;
}

function AnimatedStat({ end, suffix = "", label, duration = 1.8 }: StatProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * end));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative"
    >
      <div className="text-4xl lg:text-5xl font-semibold tracking-tight text-white tabular-nums">
        {count.toLocaleString()}
        <span className="text-[var(--accent-light)]">{suffix}</span>
      </div>
      <div className="text-sm text-[var(--text-secondary)] mt-2">{label}</div>
    </motion.div>
  );
}

export default function StatsCounter() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      <AnimatedStat end={450000} suffix="+" label="Active Trials" />
      <AnimatedStat end={195} label="Countries" />
      <AnimatedStat end={98} suffix="%" label="Match Accuracy" />
      <AnimatedStat end={500} label="Conditions Indexed" />
    </div>
  );
}
