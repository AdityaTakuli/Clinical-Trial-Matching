"use client";

import { motion } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

interface Trial {
  nct_id: string;
  title: string;
  score: number;
  condition_similarity: number;
  eligibility_score: number;
  location_score: number;
  matched_condition: string;
}

export function MatchRadar({ trial }: { trial: Trial }) {
  const data = [
    {
      metric: "Condition",
      value: Math.round((trial.condition_similarity || 0) * 100),
    },
    {
      metric: "Eligibility",
      value: Math.round((trial.eligibility_score || 0) * 100),
    },
    {
      metric: "Location",
      value: Math.round((trial.location_score || 0) * 100),
    },
    {
      metric: "Overall",
      value: Math.round((trial.score || 0) * 100),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-[200px]"
    >
      <ResponsiveContainer>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#1e1e2e" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "#9d9db5", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "#6b7280", fontSize: 9 }}
          />
          <Radar
            dataKey="value"
            stroke="#6c63ff"
            fill="#6c63ff"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function TrialComparisonChart({ trials }: { trials: Trial[] }) {
  const data = trials.slice(0, 5).map((t) => ({
    name: t.nct_id?.slice(3, 11) || "Trial",
    score: Math.round((t.score || 0) * 100),
    condition: t.matched_condition,
  }));

  const colors = ["#6c63ff", "#8b83ff", "#a78bfa", "#c4b5fd", "#ddd6fe"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full h-[200px]"
    >
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: "#9d9db5", fontSize: 10 }}
            axisLine={{ stroke: "#1e1e2e" }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#6b7280", fontSize: 10 }}
            axisLine={{ stroke: "#1e1e2e" }}
          />
          <Tooltip
            contentStyle={{
              background: "#16161f",
              border: "1px solid #1e1e2e",
              borderRadius: "8px",
              color: "#f0f0f5",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
