"use client";

import { getEmailError } from "@/lib/validators";

interface EmailFieldProps {
  value: string;
  onChange: (value: string) => void;
  touched: boolean;
  onBlur: () => void;
  placeholder?: string;
}

export function EmailField({
  value,
  onChange,
  touched,
  onBlur,
  placeholder = "Email",
}: EmailFieldProps) {
  const error = touched ? getEmailError(value) : null;

  return (
    <div>
      <input
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`input-field ${error ? "ring-2 ring-red-500/50" : ""}`}
        aria-invalid={!!error}
        required
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
