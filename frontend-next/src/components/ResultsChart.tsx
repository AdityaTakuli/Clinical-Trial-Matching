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

const GRID = "rgba(255,255,255,0.08)";
const AXIS = "#8b8b90";
const MUTED = "#56565c";

export function MatchRadar({ trial }: { trial: Trial }) {
  const data = [
    { metric: "Condition", value: Math.round((trial.condition_similarity || 0) * 100) },
    { metric: "Eligibility", value: Math.round((trial.eligibility_score || 0) * 100) },
    { metric: "Location", value: Math.round((trial.location_score || 0) * 100) },
    { metric: "Overall", value: Math.round((trial.score || 0) * 100) },
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
          <PolarGrid stroke={GRID} />
          <PolarAngleAxis dataKey="metric" tick={{ fill: AXIS, fontSize: 11 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: MUTED, fontSize: 9 }} />
          <Radar
            dataKey="value"
            stroke="#2f74ff"
            fill="#2f74ff"
            fillOpacity={0.22}
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

  // Blue gradient palette, brightest first
  const colors = ["#2f74ff", "#4a86ff", "#5b95ff", "#7cb0ff", "#9cc4ff"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full h-[200px]"
    >
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
          <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 10 }} axisLine={{ stroke: GRID }} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: MUTED, fontSize: 10 }} axisLine={{ stroke: GRID }} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            contentStyle={{
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "10px",
              color: "#ffffff",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
