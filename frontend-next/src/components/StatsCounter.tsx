"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface StatProps {
  end: number;
  suffix?: string;
  label: string;
  duration?: number;
}

function AnimatedStat({ end, suffix = "", label, duration = 2 }: StatProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = end / (duration * 60);
    const interval = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(interval);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(interval);
  }, [end, duration]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="text-4xl font-bold gradient-text">
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="text-sm text-[var(--text-secondary)] mt-1">{label}</div>
    </motion.div>
  );
}

export default function StatsCounter() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      <AnimatedStat end={450000} suffix="+" label="Active Trials" />
      <AnimatedStat end={195} suffix="" label="Countries" />
      <AnimatedStat end={98} suffix="%" label="Match Accuracy" />
      <AnimatedStat end={500} suffix="" label="Conditions Indexed" />
    </div>
  );
}
