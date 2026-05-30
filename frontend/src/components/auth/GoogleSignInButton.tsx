"use client";

import { useState } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";

interface GoogleSignInButtonProps {
  label?: "signup_with" | "signin_with" | "continue_with";
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function GoogleSignInButton({
  label = "continue_with",
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return (
      <p className="text-xs text-center text-[var(--text-secondary)]">
        Google sign-in: set <code className="text-brand-500">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in env
      </p>
    );
  }

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      onError?.("Google did not return a credential");
      return;
    }
    setLoading(true);
    try {
      await loginWithGoogle(response.credential);
      onSuccess?.();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative w-full ${loading ? "opacity-60 pointer-events-none" : ""}`}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError?.("Google sign-in was cancelled or failed")}
        useOneTap={false}
        theme="outline"
        size="large"
        text={label}
        shape="rectangular"
      />
      {loading && (
        <p className="text-xs text-center text-[var(--text-secondary)] mt-2">Signing in with Google…</p>
      )}
    </div>
  );
}
