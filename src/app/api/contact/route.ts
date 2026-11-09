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

  const clean = (v: unknown, max = 500) =>
    String(v ?? "")
      .trim()
      .slice(0, max);
  const entry = {
    first_name: clean(body.firstName, 100),
    last_name: clean(body.lastName, 100),
    email: clean(body.email, 200).toLowerCase(),
    company: clean(body.company, 200),
    role: clean(body.role, 60),
    message: clean(body.message, 4000),
  };

  if (!entry.first_name || !EMAIL.test(entry.email)) {
    return NextResponse.json({ error: "Please add your name and a valid email." }, { status: 422 });
  }
  // Honeypot field for bots.
  if (clean(body.website)) return NextResponse.json({ ok: true });

  const supabase = getServerSupabase();
  if (!supabase) {
    console.info("[contact] Supabase not configured yet — submission:", entry);
    return NextResponse.json({ ok: true, stored: false });
  }

  const { error } = await supabase.from("contact_submissions").insert(entry);
  if (error) {
    console.error("[contact] Supabase insert failed:", error.message);
    return NextResponse.json({ error: "We couldn't send your message. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, stored: true });
}
