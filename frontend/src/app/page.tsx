"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain, Calendar, BarChart3, Sparkles, ArrowRight, Zap,
  Target, Clock, Trophy, BookOpen,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const features = [
  { icon: Brain, title: "AI Adaptive Learning", desc: "Personalized recommendations based on your performance and weak topics" },
  { icon: Sparkles, title: "Smart Quiz Engine", desc: "Auto-generate MCQs, T/F, fill-blanks from topics, notes, or syllabus" },
  { icon: Calendar, title: "Study Planner", desc: "AI timetables, Pomodoro focus, drag-and-drop scheduling" },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Track accuracy, strengths, exam readiness, and streaks" },
  { icon: Target, title: "Exam Prep Modes", desc: "JEE, NEET, GATE, CET — customized learning paths" },
  { icon: Trophy, title: "Gamification", desc: "XP, badges, leaderboards, and achievement milestones" },
];

export default function LandingPage() {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen mesh-bg">
      <header className="fixed top-0 w-full z-50 glass border-b border-[var(--glass-border)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl gradient-text">LearnIQ</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-[var(--text-secondary)]">
            <a href="#features" className="hover:text-brand-500 transition">Features</a>
            <a href="#how" className="hover:text-brand-500 transition">How it works</a>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={toggle} className="p-2 rounded-lg glass text-sm">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <Link href="/login" className="btn-secondary text-sm py-2 px-4">Log in</Link>
            <Link href="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-brand-500 mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Personalized Learning
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
              Learn smarter with{" "}
              <span className="gradient-text">adaptive intelligence</span>
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10">
              Master any subject with AI recommendations, intelligent quizzes, smart scheduling,
              and real-time analytics. Built for students preparing for JEE, NEET, GATE, and beyond.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary inline-flex items-center justify-center gap-2">
                Start Learning Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="btn-secondary inline-flex items-center justify-center gap-2">
                Sign In
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {[
              { label: "Active Students", value: "10K+" },
              { label: "Quizzes Generated", value: "500K+" },
              { label: "Avg. Score Boost", value: "+28%" },
              { label: "Study Streaks", value: "1M+" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card text-center !p-4">
                <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
            Everything you need to excel
          </h2>
          <p className="text-center text-[var(--text-secondary)] mb-12 max-w-xl mx-auto">
            A complete learning ecosystem with futuristic design and production-ready architecture.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass-card group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-500/15 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <f.icon className="w-6 h-6 text-brand-500" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="py-20 px-6">
        <div className="max-w-4xl mx-auto glass-card">
          <h2 className="font-display text-2xl font-bold mb-8 text-center">How LearnIQ works</h2>
          <div className="space-y-6">
            {[
              { step: "01", title: "Set your goals", desc: "Choose subjects, exam mode (JEE/NEET/GATE), and daily study hours", icon: Target },
              { step: "02", title: "Learn adaptively", desc: "AI suggests topics, adjusts quiz difficulty, and tracks weak areas", icon: Brain },
              { step: "03", title: "Plan & focus", desc: "Smart timetable, Pomodoro sessions, spaced repetition reminders", icon: Clock },
              { step: "04", title: "Track & improve", desc: "Analytics dashboard predicts exam readiness and celebrates milestones", icon: BookOpen },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 items-start">
                <span className="text-3xl font-bold text-brand-500/30">{item.step}</span>
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <item.icon className="w-5 h-5 text-brand-500" />
                    {item.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-[var(--glass-border)] text-center text-sm text-[var(--text-secondary)]">
        © 2026 LearnIQ. Built with Next.js, Express, PostgreSQL & Groq AI.
      </footer>
    </div>
  );
}
