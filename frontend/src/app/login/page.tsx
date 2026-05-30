"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { EmailField } from "@/components/auth/EmailField";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { getEmailError, normalizeEmail } from "@/lib/validators";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailTouched(true);

    const emailError = getEmailError(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    try {
      await login(normalizeEmail(email), password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Check email, password, and that the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-card"
      >
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-2xl gradient-text">LearnIQ</span>
        </Link>

        <h1 className="text-2xl font-bold text-center mb-2">Welcome back</h1>
        <p className="text-center text-[var(--text-secondary)] text-sm mb-6">Sign in to your account</p>

        <div className="space-y-4 mb-6">
          <GoogleSignInButton
            label="signin_with"
            onSuccess={() => router.push("/dashboard")}
            onError={setError}
          />
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-secondary)]">or with email</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <EmailField
            value={email}
            onChange={setEmail}
            touched={emailTouched}
            onBlur={() => setEmailTouched(true)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            required
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-[var(--text-secondary)]">
          No account? <Link href="/register" className="text-brand-500 font-medium">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}
