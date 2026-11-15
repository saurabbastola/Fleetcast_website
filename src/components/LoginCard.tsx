"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { EMAIL, Field, GoogleButton, OrDivider, readAuthRedirectError } from "@/components/auth/AuthUi";
import { Mark } from "@/components/Logo";
import { api, apiUrl, ApiError } from "@/lib/api/client";
import { login, dashboardPath } from "@/lib/api/auth";

export default function LoginCard({ portal, portalKey }: { portal: string; portalKey?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "password">("email");
  const [role, setRole] = useState<"BUSINESS" | "DRIVER">(portalKey === "fleet" ? "DRIVER" : "BUSINESS");
  const [busy, setBusy] = useState(""); const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [show, setShow] = useState(false);
  useEffect(() => { const message = readAuthRedirectError(true); if (message) setError(message); }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setNotice("");
    if (step === "email") { if (!EMAIL.test(email.trim())) return setError("Please enter a valid email address."); setStep("password"); return; }
    setBusy("login");
    try { const result = await login(email.trim(), password); window.dispatchEvent(new Event("fleetcast-auth-changed")); router.replace(dashboardPath(result.user.role)); }
    catch (err) { setError(err instanceof ApiError ? err.message : "We couldn't sign you in. Check your connection and try again."); }
    finally { setBusy(""); }
  };
  const forgot = async () => {
    if (!EMAIL.test(email.trim())) return setError("Enter your email address first, then choose Forgot password.");
    setBusy("reset"); setError("");
    try { const result = await api<{detail:string}>("/auth/forgot-password/", {method:"POST", body:JSON.stringify({email:email.trim()})}); setNotice(result.detail); }
    catch (err) { setError(err instanceof ApiError ? err.message : "We couldn't send reset instructions."); }
    finally { setBusy(""); }
  };
  const resendVerification = async()=>{if(!EMAIL.test(email.trim()))return setError("Enter your email address first.");setBusy("verification");setError("");try{const result=await api<{detail:string}>("/auth/resend-verification/",{method:"POST",body:JSON.stringify({email:email.trim()})});setNotice(result.detail);}catch(err){setError(err instanceof ApiError?err.message:"A verification link could not be sent.");}finally{setBusy("");}};
  const google = () => window.location.assign(apiUrl(`/auth/google/start/?role=${role}`));
  const qs = portalKey ? `?portal=${encodeURIComponent(portalKey)}` : "";
  return (
    <div className="login-card" data-step={busy || step} aria-busy={!!busy}>
      <div className="login-card__logo" aria-label="Fleetcast" role="img"><Mark className="login-card__mark" /><span>fleetcast</span></div>
      <form onSubmit={submit} noValidate>
        <h1 className="login-card__title">Welcome</h1>
        <p className="login-card__sub">Log in to Fleetcast to continue to the {portal}.</p>
        <label className="field auth-role"><span>Account type</span><select value={role} onChange={(e) => setRole(e.target.value as typeof role)}><option value="BUSINESS">Business / Advertiser</option><option value="DRIVER">Vehicle Owner / Driver</option></select></label>
        <GoogleButton onClick={google} busy={busy === "google"} disabled={!!busy} /><OrDivider />
        <Field label="Email address*" type="email" value={email} onChange={setEmail} autoComplete="username" invalid={!!error} />
        {step === "password" && <>
          <div className="login-card__identity"><span>{email}</span><button type="button" className="login-link login-link--inline" onClick={() => { setStep("email"); setPassword(""); setError(""); }}>Edit</button></div>
          <Field label="Password*" type={show ? "text" : "password"} value={password} onChange={setPassword} autoComplete="current-password" invalid={!!error} trailing={<button type="button" className="ofield__toggle" onClick={() => setShow((v) => !v)}>{show ? "Hide" : "Show"}</button>} />
          <button type="button" className="login-link login-link--left" onClick={forgot} disabled={!!busy}>{busy === "reset" ? "Sending reset instructions…" : "Forgot password?"}</button>
        </>}
        {error && <p className="login-card__error" role="alert">{error}</p>}{notice && <p className="login-card__notice" role="status">{notice}</p>}
        {error.toLowerCase().includes("verification")&&<button type="button" className="login-link" onClick={resendVerification} disabled={!!busy}>{busy==="verification"?"Sending…":"Resend verification email"}</button>}
        <button type="submit" className="login-btn" disabled={!!busy}>{busy === "login" ? "Signing in…" : step === "email" ? "Continue" : "Log in"}</button>
        <p className="auth-switch">New to Fleetcast? <Link href={`/signup${qs}`}>Create an account</Link></p>
      </form>
      <Link href="/" className="login-card__back">← Back to fleetcast.com</Link>
    </div>
  );
}
