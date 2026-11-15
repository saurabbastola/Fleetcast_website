import { api, ensureCsrf } from "./client";
import type { Account } from "@/lib/machines/session";

export type ApiUser = { id: string; email: string; name: string; first_name: string; last_name: string; phone: string; role: "ADMIN" | "BUSINESS" | "DRIVER"; auth_provider: string };
export const getProfile = () => api<ApiUser>("/auth/profile/");
export async function login(email: string, password: string) { await ensureCsrf(); return api<{user: ApiUser}>("/auth/login/", { method: "POST", body: JSON.stringify({ email, password }) }); }
export async function register(input: {email: string; password: string; first_name: string; last_name: string; phone?: string; role: "BUSINESS" | "DRIVER"; company_name?: string}) { await ensureCsrf(); return api<{verification_required:boolean;detail:string}>("/auth/register/", { method: "POST", body: JSON.stringify(input) }); }
export async function logout() { await ensureCsrf(); return api("/auth/logout/", { method: "POST" }); }
export function asAccount(user: ApiUser): Account {
  return { id: user.id, email: user.email, name: user.name || user.email.split("@")[0], initials: user.name?.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?", avatarUrl: null, provider: user.auth_provider || "password", role: user.role };
}
export function dashboardPath(role: ApiUser["role"]): string { return role === "ADMIN" ? "/dashboard/admin" : "/dashboard"; }
