import { Suspense } from "react";
import VerifyEmailCard from "@/components/VerifyEmailCard";
export default function VerifyEmailPage(){return <div className="login"><main className="login__main"><Suspense fallback={<p role="status">Loading…</p>}><VerifyEmailCard/></Suspense></main></div>;}
