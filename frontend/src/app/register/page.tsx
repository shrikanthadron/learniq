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

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
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

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: normalizeEmail(email),
        password,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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

        <h1 className="text-2xl font-bold text-center mb-6">Create your account</h1>

        <div className="space-y-4 mb-6">
          <GoogleSignInButton
            label="signup_with"
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
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            minLength={2}
            required
          />
          <EmailField
            value={email}
            onChange={setEmail}
            touched={emailTouched}
            onBlur={() => setEmailTouched(true)}
          />
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            minLength={6}
            required
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-[var(--text-secondary)]">
          Already have an account? <Link href="/login" className="text-brand-500 font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
