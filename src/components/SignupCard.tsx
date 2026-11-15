"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { EMAIL, Field, GoogleButton, MIN_PASSWORD, OrDivider } from "@/components/auth/AuthUi";
import { Mark } from "@/components/Logo";
import { apiUrl, ApiError, api } from "@/lib/api/client";
import { register } from "@/lib/api/auth";

export default function SignupCard({ portal, portalKey }: { portal: string; portalKey?: string }) {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [company, setCompany] = useState(""); const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"BUSINESS" | "DRIVER">(portalKey === "fleet" ? "DRIVER" : "BUSINESS");
  const [busy, setBusy] = useState(""); const [error, setError] = useState(""); const [show, setShow] = useState(false);
  const [registered, setRegistered] = useState(false); const [notice, setNotice] = useState("");
  const firstLast = () => { const parts = name.trim().split(/\s+/); return {first_name:parts.shift() || "", last_name:parts.join(" ")}; };
  const create = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    if (!name.trim()) return setError("Please enter your name.");
    if (!EMAIL.test(email.trim())) return setError("Please enter a valid email address.");
    if (password.length < MIN_PASSWORD) return setError(`Please use at least ${MIN_PASSWORD} characters for your password.`);
    if (role === "BUSINESS" && !company.trim()) return setError("Please enter your company name.");
    setBusy("create");
    try { const result = await register({email:email.trim(), password, ...firstLast(), phone, role, ...(role === "BUSINESS" ? {company_name:company.trim()} : {})}); setRegistered(true);setNotice(result.detail); }
    catch (err) { setError(err instanceof ApiError ? err.message : "We couldn't create your account. Check your connection and try again."); }
    finally { setBusy(""); }
  };
  const google = () => window.location.assign(apiUrl(`/auth/google/start/?role=${role}`));
  const resend = async()=>{setBusy("resend");setError("");try{const result=await api<{detail:string}>("/auth/resend-verification/",{method:"POST",body:JSON.stringify({email:email.trim()})});setNotice(result.detail);}catch(err){setError(err instanceof ApiError?err.message:"A new verification link could not be sent.");}finally{setBusy("");}};
  const qs = portalKey ? `?portal=${encodeURIComponent(portalKey)}` : "";
  return (
    <div className="login-card" data-step={busy ? "submitting" : "form"} aria-busy={!!busy}>
      <div className="login-card__logo" aria-label="Fleetcast" role="img"><Mark className="login-card__mark" /><span>fleetcast</span></div>
      {registered?<div><h1 className="login-card__title">Check your email</h1><p className="login-card__sub">{notice}</p>{error&&<p className="login-card__error" role="alert">{error}</p>}<button type="button" className="login-link" onClick={resend} disabled={!!busy}>{busy?"Sending…":"Send a new verification link"}</button><p className="auth-switch">Already verified? <Link href={`/login${qs}`}>Log in</Link></p></div>:<form onSubmit={create} noValidate>
        <h1 className="login-card__title">Create your account</h1>
        <p className="login-card__sub">Sign up for Fleetcast to get started with the {portal}.</p>
        <label className="field auth-role"><span>Account type</span><select value={role} onChange={(e) => setRole(e.target.value as typeof role)}><option value="BUSINESS">Business / Advertiser</option><option value="DRIVER">Vehicle Owner / Driver</option></select></label>
        <GoogleButton onClick={google} busy={busy === "google"} disabled={!!busy} /><OrDivider />
        <Field label="Full name*" value={name} onChange={setName} autoComplete="name" />
        {role === "BUSINESS" && <Field label="Company name*" value={company} onChange={setCompany} autoComplete="organization" />}
        <Field label="Phone" type="tel" value={phone} onChange={setPhone} autoComplete="tel" />
        <Field label="Work email*" type="email" value={email} onChange={setEmail} autoComplete="email" inputMode="email" />
        <Field label={`Password* (${MIN_PASSWORD}+ characters)`} type={show ? "text" : "password"} value={password} onChange={setPassword} autoComplete="new-password" trailing={<button type="button" className="ofield__toggle" onClick={() => setShow((v) => !v)}>{show ? "Hide" : "Show"}</button>} />
        {error && <p className="login-card__error" role="alert">{error}</p>}
        <button type="submit" className="login-btn" disabled={!!busy}>{busy ? "Creating account…" : "Create account"}</button>
        <p className="auth-switch">Already have an account? <Link href={`/login${qs}`}>Log in</Link></p>
      </form>}
      <Link href="/" className="login-card__back">← Back to fleetcast.com</Link>
    </div>
  );
}
