"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useReducer, useRef, useState, type FormEvent } from "react";
import { EMAIL, Field, GoogleButton, OrDivider, authErrorMessage, startGoogle } from "@/components/auth/AuthUi";
import { Mark } from "@/components/Logo";
import { loginEmail, loginReducer, type LoginState } from "@/lib/machines/login";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase";

// Same on server and client (env vars are inlined), so no hydration mismatch.
const initialLogin: LoginState = isSupabaseConfigured ? { step: "checking" } : loginEmail;

/**
 * Two-step login plus "Continue with Google".
 * State machine: lib/machines/login.ts (exposed as `data-step`).
 */
export default function LoginCard({ portal, portalKey }: { portal: string; portalKey?: string }) {
  const supabase = getBrowserSupabase();
  const [state, dispatch] = useReducer(loginReducer, initialLogin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const after = process.env.NEXT_PUBLIC_AFTER_LOGIN_URL || "/dashboard";
  const qs = portalKey ? `?portal=${encodeURIComponent(portalKey)}` : "";
  const { step } = state;
  const busy = state.step === "password" ? state.busy : null;
  const error = state.step === "email" || state.step === "password" ? state.error : null;
  const notice = state.step === "password" ? state.notice : null;

  useEffect(() => {
    if (!supabase) {
      dispatch({ type: "SESSION_NONE" });
      return;
    }
    let live = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!live) return;
        const found = data.session?.user?.email;
        dispatch(found ? { type: "SESSION_FOUND", email: found } : { type: "SESSION_NONE" });
      })
      .catch(() => live && dispatch({ type: "SESSION_NONE" }));
    return () => {
      live = false;
    };
  }, [supabase]);

  useEffect(() => {
    const el = step === "email" ? emailRef.current : step === "password" ? passRef.current : null;
    el?.focus();
  }, [step]);

  const next = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state.step === "email") {
      dispatch(EMAIL.test(email.trim()) ? { type: "EMAIL_OK" } : { type: "FAIL", message: "Please enter a valid email address." });
      return;
    }
    if (state.step !== "password" || state.busy) return;
    if (!password) return dispatch({ type: "FAIL", message: "Please enter your password." });
    if (!supabase) {
      return dispatch({ type: "FAIL", message: "Login isn't connected yet — add your Supabase keys to .env.local (see README)." });
    }
    dispatch({ type: "SIGN_IN" });
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) return dispatch({ type: "FAIL", message: authErrorMessage(err, "Signing in") });
    dispatch({ type: "SIGNED_IN", email: email.trim() });
    router.replace(after);
  };

  const google = async () => {
    if (!supabase) return dispatch({ type: "FAIL", message: "Google sign-in needs Supabase to be connected." });
    dispatch({ type: "GOOGLE" });
    const failed = await startGoogle(supabase, "/dashboard");
    if (failed) dispatch({ type: "FAIL", message: failed });
  };

  const forgot = async () => {
    if (state.step !== "password" || state.busy) return;
    if (!supabase) return dispatch({ type: "FAIL", message: "Password reset needs Supabase to be connected." });
    dispatch({ type: "SEND_RESET" });
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });
    dispatch(
      err ? { type: "FAIL", message: authErrorMessage(err, "Sending the reset link") } : { type: "RESET_SENT", notice: `We sent a reset link to ${email.trim()}.` }
    );
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
    setPassword("");
    dispatch({ type: "SIGNED_OUT" });
  };

  return (
    <div className="login-card" data-step={step} aria-busy={step === "checking" || step === "redirecting" || !!busy}>
      <div className="login-card__logo" aria-label="Fleetcast" role="img">
        <Mark className="login-card__mark" />
        <span>fleetcast</span>
      </div>

      {state.step === "checking" || state.step === "redirecting" ? (
        <p className="login-card__sub login-card__checking" role="status">
          {state.step === "checking" ? "Checking your session…" : "Taking you to Google…"}
        </p>
      ) : state.step === "signedIn" ? (
        <>
          <h1 className="login-card__title">You&rsquo;re signed in</h1>
          <p className="login-card__sub">
            Signed in as <strong>{state.email}</strong>.
          </p>
          <a href={after} className="login-btn">
            Continue
          </a>
          <button type="button" className="login-link" onClick={signOut}>
            Sign out
          </button>
        </>
      ) : (
        <form onSubmit={next} noValidate>
          <h1 className="login-card__title">Welcome</h1>
          <p className="login-card__sub">Log in to Fleetcast to continue to the {portal}.</p>

          <GoogleButton onClick={google} disabled={!!busy} />
          <OrDivider />

          {step === "email" ? (
            <Field
              label="Username or email address*"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="username"
              inputRef={emailRef}
              invalid={!!error}
            />
          ) : (
            <>
              <div className="login-card__identity">
                <span>{email}</span>
                <button
                  type="button"
                  className="login-link login-link--inline"
                  onClick={() => dispatch({ type: "EDIT_EMAIL" })}
                  disabled={!!busy}
                >
                  Edit
                </button>
              </div>
              <Field
                label="Password*"
                type={show ? "text" : "password"}
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                inputRef={passRef}
                invalid={!!error}
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
              <button type="button" className="login-link login-link--left" onClick={forgot} disabled={!!busy}>
                {busy === "reset" ? "Sending reset link…" : "Forgot password?"}
              </button>
            </>
          )}

          {error && (
            <p className="login-card__error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="login-card__notice" role="status">
              {notice}
            </p>
          )}

          <button type="submit" className="login-btn" disabled={!!busy}>
            {busy === "sign-in" ? "Signing in…" : "Continue"}
          </button>

          <p className="auth-switch">
            New to Fleetcast? <Link href={`/signup${qs}`}>Create an account</Link>
          </p>

          {!isSupabaseConfigured && <p className="login-card__dev">Dev mode: connect Supabase to enable sign-in.</p>}
        </form>
      )}

      <Link href="/" className="login-card__back">
        ← Back to fleetcast.com
      </Link>
    </div>
  );
}
