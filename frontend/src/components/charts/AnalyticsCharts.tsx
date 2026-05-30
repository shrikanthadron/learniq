"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area,
} from "recharts";

interface Props {
  accuracyTrend: { date: string; accuracy: number }[];
  studyTime: { date: string; minutes: number }[];
  topicStrengths: { topic: string; score: number; strength: string }[];
}

export function AccuracyChart({ data }: { data: Props["accuracyTrend"] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <Tooltip contentStyle={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", borderRadius: 12 }} />
        <Line type="monotone" dataKey="accuracy" stroke="#6366f1" strokeWidth={3} dot={{ fill: "#6366f1" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StudyTimeChart({ data }: { data: Props["studyTime"] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <Tooltip contentStyle={{ background: "var(--glass-bg)", borderRadius: 12 }} />
        <Area type="monotone" dataKey="minutes" stroke="#06b6d4" fill="url(#studyGrad)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TopicRadarChart({ data }: { data: Props["topicStrengths"] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(148,163,184,0.3)" />
        <PolarAngleAxis dataKey="topic" tick={{ fontSize: 10 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function TopicBarChart({ data }: { data: Props["topicStrengths"] }) {
  const colored = data.map((d) => ({
    ...d,
    fill: d.strength === "strong" ? "#10b981" : d.strength === "moderate" ? "#f59e0b" : "#ef4444",
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={colored} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="topic" width={100} tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={{ borderRadius: 12 }} />
        <Bar dataKey="score" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
