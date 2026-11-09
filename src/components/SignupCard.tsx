"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useReducer, useRef, useState, type FormEvent } from "react";
import { EMAIL, Field, GoogleButton, MIN_PASSWORD, OrDivider, authErrorMessage, startGoogle } from "@/components/auth/AuthUi";
import { Mark } from "@/components/Logo";
import { signupForm, signupReducer } from "@/lib/machines/signup";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase";

const NOT_CONNECTED = "Sign-up isn't connected yet — add your Supabase keys to .env.local (see README).";

/**
 * Create an account: "Continue with Google", or email + password followed by a
 * 6-digit code (the email also contains a link that works instead of the code).
 * State machine: lib/machines/signup.ts (exposed as `data-step`).
 * New accounts get a row in public.profiles automatically (supabase/profiles.sql).
 */
export default function SignupCard({ portal, portalKey }: { portal: string; portalKey?: string }) {
  const supabase = getBrowserSupabase();
  const [state, dispatch] = useReducer(signupReducer, signupForm);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const codeRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const after = process.env.NEXT_PUBLIC_AFTER_LOGIN_URL || "/dashboard";
  const qs = portalKey ? `?portal=${encodeURIComponent(portalKey)}` : "";
  const { step } = state;
  const busy = state.step === "done" ? null : state.busy;
  const error = state.step === "done" ? null : state.error;

  useEffect(() => {
    (step === "form" ? nameRef : step === "verify" ? codeRef : null)?.current?.focus();
  }, [step]);

  // Account ready: go straight to the dashboard.
  useEffect(() => {
    if (step === "done") router.replace(after);
  }, [step, router, after]);

  // The link in the confirmation email signs the visitor in and opens their dashboard.
  const emailRedirectTo = () => `${window.location.origin}/dashboard`;

  const create = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state.step !== "form" || state.busy) return;
    const cleanEmail = email.trim();
    if (!name.trim()) return dispatch({ type: "FAIL", message: "Please enter your name." });
    if (!EMAIL.test(cleanEmail)) return dispatch({ type: "FAIL", message: "Please enter a valid email address." });
    if (password.length < MIN_PASSWORD) {
      return dispatch({ type: "FAIL", message: `Please use at least ${MIN_PASSWORD} characters for your password.` });
    }
    if (!supabase) return dispatch({ type: "FAIL", message: NOT_CONNECTED });

    dispatch({ type: "CREATE" });
    const { data, error: err } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { full_name: name.trim(), portal: portalKey ?? null }, emailRedirectTo: emailRedirectTo() },
    });
    if (err) return dispatch({ type: "FAIL", message: authErrorMessage(err, "Creating your account") });
    // Projects with "Confirm email" switched off sign the visitor straight in.
    if (data.session) return dispatch({ type: "VERIFIED", email: cleanEmail });
    dispatch({ type: "NEEDS_VERIFY", email: cleanEmail });
  };

  const verify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state.step !== "verify" || state.busy) return;
    const token = code.replace(/\D/g, "");
    if (token.length < 6) return dispatch({ type: "FAIL", message: "Enter the 6-digit code from the email." });
    if (!supabase) return dispatch({ type: "FAIL", message: NOT_CONNECTED });
    dispatch({ type: "VERIFY" });
    const { error: err } = await supabase.auth.verifyOtp({ email: state.email, token, type: "email" });
    dispatch(
      err
        ? { type: "FAIL", message: err.code === "otp_expired" ? "That code is wrong or has expired. Check it, or send a new one." : authErrorMessage(err, "Verifying") }
        : { type: "VERIFIED", email: state.email }
    );
  };

  const resend = async () => {
    if (state.step !== "verify" || state.busy || !supabase) return;
    dispatch({ type: "RESEND" });
    const { error: err } = await supabase.auth.resend({ type: "signup", email: state.email, options: { emailRedirectTo: emailRedirectTo() } });
    dispatch(err ? { type: "FAIL", message: authErrorMessage(err, "Sending a new code") } : { type: "RESENT", notice: `We sent a new code to ${state.email}.` });
  };

  const google = async () => {
    if (!supabase) return dispatch({ type: "FAIL", message: NOT_CONNECTED });
    dispatch({ type: "GOOGLE" });
    const failed = await startGoogle(supabase, "/dashboard");
    if (failed) dispatch({ type: "FAIL", message: failed });
  };

  return (
    <div className="login-card" data-step={step} aria-busy={!!busy}>
      <div className="login-card__logo" aria-label="Fleetcast" role="img">
        <Mark className="login-card__mark" />
        <span>fleetcast</span>
      </div>

      {state.step === "done" ? (
        <>
          <h1 className="login-card__title">You&rsquo;re all set</h1>
          <p className="login-card__sub">
            Your account is ready and you&rsquo;re signed in as <strong>{state.email}</strong>.
          </p>
          <a href={after} className="login-btn">
            Continue
          </a>
        </>
      ) : state.step === "verify" ? (
        <form onSubmit={verify} noValidate>
          <h1 className="login-card__title">Check your email</h1>
          <p className="login-card__sub">
            We sent a 6-digit code to <strong>{state.email}</strong>. Enter it below, or click the link in the email.
          </p>
          <Field
            label="Verification code*"
            value={code}
            onChange={(v) => setCode(v.replace(/[^\d]/g, "").slice(0, 10))}
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={10}
            inputRef={codeRef}
            invalid={!!error}
          />
          {error && (
            <p className="login-card__error" role="alert">
              {error}
            </p>
          )}
          {state.notice && (
            <p className="login-card__notice" role="status">
              {state.notice}
            </p>
          )}
          <button type="submit" className="login-btn" disabled={!!busy}>
            {busy === "verify" ? "Verifying…" : "Verify and continue"}
          </button>
          <p className="auth-switch">
            No email?{" "}
            <button type="button" className="login-link login-link--inline" onClick={resend} disabled={!!busy}>
              {busy === "resend" ? "Sending…" : "Send a new code"}
            </button>{" "}
            ·{" "}
            <button type="button" className="login-link login-link--inline" onClick={() => dispatch({ type: "BACK" })} disabled={!!busy}>
              Use a different email
            </button>
          </p>
          <p className="auth-fine">
            Already have an account? <Link href={`/login${qs}`}>Log in</Link>
          </p>
        </form>
      ) : (
        <form onSubmit={create} noValidate>
          <h1 className="login-card__title">Create your account</h1>
          <p className="login-card__sub">Sign up for Fleetcast to get started with the {portal}.</p>

          <GoogleButton onClick={google} busy={busy === "google"} disabled={!!busy} />
          <OrDivider />

          <Field label="Full name*" value={name} onChange={setName} autoComplete="name" inputRef={nameRef} />
          <Field label="Work email*" type="email" value={email} onChange={setEmail} autoComplete="email" inputMode="email" />
          <Field
            label={`Password* (${MIN_PASSWORD}+ characters)`}
            type={show ? "text" : "password"}
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            trailing={
              <button
                type="button"
                className="ofield__toggle"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? "Hide" : "Show"}
              </button>
            }
          />

          {error && (
            <p className="login-card__error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="login-btn" disabled={!!busy}>
            {busy === "create" ? "Creating account…" : "Create account"}
          </button>

          <p className="auth-switch">
            Already have an account? <Link href={`/login${qs}`}>Log in</Link>
          </p>
          {!isSupabaseConfigured && <p className="login-card__dev">Dev mode: connect Supabase to enable sign-up.</p>}
        </form>
      )}

      <Link href="/" className="login-card__back">
        ← Back to fleetcast.com
      </Link>
    </div>
  );
}
