"use client";

import type { ReactNode, RefObject } from "react";

/** Shared pieces for the login and sign-up cards. */

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 10;

export function Field({
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  inputRef,
  trailing,
  invalid,
  inputMode,
  maxLength,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  trailing?: ReactNode;
  invalid?: boolean;
  inputMode?: "numeric" | "email" | "text";
  maxLength?: number;
}) {
  return (
    <label className={`ofield${value ? " has-value" : ""}${invalid ? " is-invalid" : ""}`}>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        required
        placeholder=" "
        aria-invalid={invalid || undefined}
      />
      <span className="ofield__label">{label}</span>
      {trailing}
    </label>
  );
}

export function GoogleButton({ onClick, busy, disabled }: { onClick: () => void; busy?: boolean; disabled?: boolean }) {
  return (
    <button type="button" className="auth-google" onClick={onClick} disabled={disabled || busy}>
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      {busy ? "Opening Google…" : "Continue with Google"}
    </button>
  );
}

export function OrDivider() {
  return (
    <p className="auth-or" aria-hidden="true">
      <span>or</span>
    </p>
  );
}

/** Translate Django OAuth callback codes without exposing provider response details. */
export function readAuthRedirectError(clear = false): string | null {
  if (typeof window === "undefined") return null;
  const query = new URLSearchParams(window.location.search);
  const code = query.get("auth_error");
  if (!code) return null;
  if (clear) {
    query.delete("auth_error");
    const qs = query.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
  }
  const messages: Record<string, string> = { oauth_state: "Sign-in could not be verified. Please try again.", google_unverified: "Google did not return a verified email address.", account_link_required: "This email already has an account. Sign in with your password before linking Google.", link_email_mismatch: "The Google email must match the verified email on this Fleetcast account.", identity_already_linked: "That Google account is already linked to another Fleetcast account.", role_required: "Choose a Business or Driver account to continue.", inactive: "This account is inactive. Contact Fleetcast support.", unverified: "Verify your email before signing in.", google_failed: "Google sign-in could not be completed. Check the server configuration and try again." };
  return messages[code] || "Sign-in could not be completed. Please try again.";
}

/** Only same-site paths, so `?next=` can't send people to another website. */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
