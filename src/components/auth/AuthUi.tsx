"use client";

import type { AuthError, SupabaseClient } from "@supabase/supabase-js";
import type { ReactNode, RefObject } from "react";

/** Shared pieces for the login and sign-up cards. */

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 8;

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

/**
 * Sends the visitor to Google. Supabase brings them back to `returnTo`, where
 * the browser client picks the session out of the URL automatically.
 * Resolves only on failure (on success the page navigates away).
 */
export async function startGoogle(supabase: SupabaseClient, returnTo: string): Promise<string | null> {
  // The redirect itself can't report "provider disabled" back to the page (the
  // browser just lands on a raw JSON error), so check the project's settings first.
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key ?? "" } });
    const settings = (await res.json()) as { external?: { google?: boolean } };
    if (res.ok && settings.external?.google === false) {
      return "Google sign-in isn't switched on yet. Please use email for now.";
    }
  } catch {
    /* settings unavailable: try the redirect anyway */
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}${returnTo}`,
      queryParams: { prompt: "select_account" },
    },
  });
  if (!error) return null;
  return error.message.toLowerCase().includes("provider is not enabled")
    ? "Google sign-in isn't switched on yet. Enable it in Supabase → Authentication → Sign In / Providers."
    : authErrorMessage(error, "Google sign-in");
}

/** Human messages for Supabase auth errors. Never reveals whether an email exists. */
export function authErrorMessage(err: AuthError, action = "That"): string {
  if (err.status === 429 || err.code === "over_email_send_rate_limit" || err.code === "over_request_rate_limit") {
    return "Too many attempts. Please wait a minute and try again.";
  }
  switch (err.code) {
    case "email_not_confirmed":
      return "Please confirm your email first. Enter the code we sent, or click the link in the email.";
    case "invalid_credentials":
      return "Wrong email or password.";
    case "otp_expired":
      return "That code has expired. Send a new one and try again.";
    case "weak_password":
      return `Please use a stronger password (at least ${MIN_PASSWORD} characters).`;
    case "signup_disabled":
      return "New sign-ups are switched off for this site.";
    case "email_address_invalid":
      return "Please enter a valid email address.";
  }
  if (err.status === 400 || err.status === 422) return err.message;
  return `${action} didn't work. Please check your connection and try again.`;
}
