import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const clean = (v: unknown, max = 200) =>
    String(v ?? "")
      .trim()
      .slice(0, max);
  const lead = {
    name: clean(body.name, 120),
    email: clean(body.email).toLowerCase(),
    company: clean(body.company),
    source: clean(body.source, 60) || "website",
  };

  if (!EMAIL.test(lead.email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 422 });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    console.info("[leads] Supabase not configured yet — lead:", lead);
    return NextResponse.json({ ok: true, stored: false });
  }

  const { error } = await supabase.from("playbook_leads").insert(lead);
  if (error) {
    console.error("[leads] Supabase insert failed:", error.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, stored: true });
}
