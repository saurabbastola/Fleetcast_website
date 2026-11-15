import { Suspense } from "react";
import ResetPasswordCard from "@/components/ResetPasswordCard";
export default function ResetPasswordPage(){return <div className="login"><main className="login__main"><Suspense fallback={<p role="status">Loading…</p>}><ResetPasswordCard/></Suspense></main></div>;}
