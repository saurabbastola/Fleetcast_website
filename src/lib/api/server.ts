import { NextResponse } from "next/server";
// Server-only calls go straight to Django; browser API calls use Vercel's same-origin rewrite.
const API_ROOT = (process.env.DJANGO_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
export async function forwardPublicPost(endpoint: string, body: Record<string, unknown>) {
  try {
    const response = await fetch(`${API_ROOT}${endpoint}`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),cache:"no-store"});
    const payload = await response.json().catch(()=>({}));
    if (!response.ok) return NextResponse.json({error:payload?.error?.message||payload?.detail||"The request could not be completed."},{status:response.status});
    return NextResponse.json({ok:true,stored:true},{status:response.status});
  } catch {
    return NextResponse.json({error:"The service is temporarily unavailable. Please try again."},{status:503});
  }
}
