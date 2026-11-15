"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api/client";
import { dashboardPath, type ApiUser } from "@/lib/api/auth";
import { Mark } from "@/components/Logo";
export default function VerifyEmailCard(){
 const router=useRouter();const [uid,setUid]=useState("");const [token,setToken]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 useEffect(()=>{const p=new URLSearchParams(window.location.hash.replace(/^#/ ,""));setUid(p.get("uid")||"");setToken(p.get("token")||"");if(window.location.hash)window.history.replaceState(window.history.state,"",`${window.location.pathname}${window.location.search}`);},[]);
 const verify=async()=>{setBusy(true);setError("");try{const result=await api<{user:ApiUser}>("/auth/verify-email/",{method:"POST",body:JSON.stringify({uid,token})});window.dispatchEvent(new Event("fleetcast-auth-changed"));router.replace(dashboardPath(result.user.role));}catch(err){setError(err instanceof ApiError?err.message:"This verification link couldn't be used. Request another link from signup.");}finally{setBusy(false);}};
 return <div className="login-card"><div className="login-card__logo" aria-label="Fleetcast" role="img"><Mark className="login-card__mark"/><span>fleetcast</span></div><h1 className="login-card__title">Verify your email</h1><p className="login-card__sub">Confirm this email address to activate your Fleetcast account.</p>{error&&<p className="login-card__error" role="alert">{error}</p>}<button type="button" className="login-btn" onClick={verify} disabled={busy||!uid||!token}>{busy?"Verifying…":"Verify email"}</button><Link href="/login" className="login-card__back">← Back to log in</Link></div>;
}
