"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api/client";
import { Field, MIN_PASSWORD } from "@/components/auth/AuthUi";
import { Mark } from "@/components/Logo";
export default function ResetPasswordCard(){
 const router=useRouter();const [uid,setUid]=useState("");const [token,setToken]=useState("");const [password,setPassword]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [success,setSuccess]=useState(false);
 useEffect(()=>{const p=new URLSearchParams(window.location.hash.replace(/^#/ ,""));setUid(p.get("uid")||"");setToken(p.get("token")||"");if(window.location.hash)window.history.replaceState(window.history.state,"",`${window.location.pathname}${window.location.search}`);},[]);
 const submit=async(e:FormEvent)=>{e.preventDefault();setError("");if(password.length<MIN_PASSWORD)return setError(`Use at least ${MIN_PASSWORD} characters.`);setBusy(true);try{await api("/auth/reset-password/",{method:"POST",body:JSON.stringify({uid,token,password})});setSuccess(true);setTimeout(()=>router.replace("/login"),1800);}catch(err){setError(err instanceof ApiError?err.message:"This reset link couldn't be used.");}finally{setBusy(false);}};
 return <div className="login-card"><div className="login-card__logo" aria-label="Fleetcast" role="img"><Mark className="login-card__mark"/><span>fleetcast</span></div><form onSubmit={submit}><h1 className="login-card__title">Reset password</h1><p className="login-card__sub">Choose a new password for your Fleetcast account.</p><Field label={`New password* (${MIN_PASSWORD}+ characters)`} type="password" value={password} onChange={setPassword} autoComplete="new-password"/>{error&&<p className="login-card__error" role="alert">{error}</p>}{success&&<p className="login-card__notice" role="status">Password reset. Returning to login…</p>}<button className="login-btn" disabled={busy||success||!uid||!token}>{busy?"Saving…":"Reset password"}</button></form><Link href="/login" className="login-card__back">← Back to log in</Link></div>;
}
