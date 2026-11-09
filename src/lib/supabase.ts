import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** True once NEXT_PUBLIC_SUPABASE_URL and the anon/publishable key are set. */
export const isSupabaseConfigured = Boolean(url && key && !url.includes("your-project-ref"));

let browserClient: SupabaseClient | null = null;

/** Browser-side client (auth on the login page). Returns null until env vars are set. */
export function getBrowserSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured || typeof window === "undefined") return null;
  if (!browserClient) browserClient = createClient(url as string, key as string);
  return browserClient;
}

/** Server-side client for API routes. Uses the same public key; RLS policies in supabase/schema.sql allow inserts only. */
export function getServerSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return createClient(url as string, key as string, { auth: { persistSession: false } });
}
