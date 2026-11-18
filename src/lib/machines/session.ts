/**
 * Who is signed in, app-wide. The single source of truth for "isLoggedIn".
 *
 *   loading ──RESOLVED(account)──► signedIn ──RESOLVED(null)──► signedOut{byUser}
 *      └─────RESOLVED(null)──────► signedOut ──RESOLVED(account)──► signedIn
 *
 * Fed by Supabase (getSession on load + onAuthStateChange), so sign-in, sign-out,
 * Google redirects and other tabs all land here. Pure: no React, no Supabase.
 *
 * `byUser` separates "pressed Sign out" (go to the landing page) from "session
 * missing or expired" (protected pages send the visitor to /login).
 */

export type Account = {
  id: string;
  email: string;
  name: string;
  initials: string;
  avatarUrl: string | null;
  provider: string;
  role: "ADMIN" | "BUSINESS" | "DRIVER";
  roles: Array<"ADMIN" | "BUSINESS" | "DRIVER">;
};

export type SessionState =
  | { status: "loading" }
  | { status: "signedOut"; byUser: boolean }
  | { status: "signedIn"; account: Account };
export type SessionEvent = { type: "RESOLVED"; account: Account | null; byUser?: boolean };

export const sessionLoading: SessionState = { status: "loading" };

const same = (a: Account, b: Account) =>
  a.id === b.id && a.email === b.email && a.name === b.name && a.avatarUrl === b.avatarUrl && a.provider === b.provider && a.role === b.role && a.roles.join(",") === b.roles.join(",");

export function sessionReducer(s: SessionState, e: SessionEvent): SessionState {
  if (!e.account) {
    const byUser = !!e.byUser || (s.status === "signedOut" && s.byUser);
    return s.status === "signedOut" && s.byUser === byUser ? s : { status: "signedOut", byUser };
  }
  // Supabase re-announces the session on token refresh; keep the same object so nothing re-renders.
  if (s.status === "signedIn" && same(s.account, e.account)) return s;
  return { status: "signedIn", account: e.account };
}

/** Maps a Django profile response shape into the session account type. */
type UserLike = {
  id: string;
  email?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  auth_provider?: string | null;
  role?: Account["role"];
  roles?: Account["role"][];
};

export function toAccount(user: UserLike | null | undefined): Account | null {
  if (!user) return null;
  const email = user.email ?? "";
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const name = str(user.name) ?? ([str(user.first_name), str(user.last_name)].filter(Boolean).join(" ") || email.split("@")[0] || "there");
  return {
    id: user.id,
    email,
    name,
    initials: initialsOf(name),
    avatarUrl: str(user.avatar_url),
    provider: str(user.auth_provider) ?? "password",
    role: user.role ?? "BUSINESS",
    roles: user.roles?.length ? user.roles : [user.role ?? "BUSINESS"],
  };
}

export function initialsOf(name: string): string {
  const parts = name.replace(/[^\p{L}\p{N}\s]/gu, " ").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** First name for greetings ("Welcome back, Sam"). */
export function firstName(account: Account): string {
  return account.name.split(/\s+/)[0] || account.name;
}
