/**
 * Two-step login card.
 *
 *   checking ──SESSION_NONE──► email ──EMAIL_OK──► password ──SIGN_IN──► password{busy:"sign-in"}
 *      │                        ▲  │                 │  ▲                     │        │
 *      │                        │  └─FAIL(msg)─┐     │  └──────FAIL(msg)──────┘        │ SIGNED_IN
 *      │                        └──EDIT_EMAIL──┼─────┘                                 ▼
 *      └───────────SESSION_FOUND(email)────────┼──────────────────────────────────► signedIn
 *                                              │      SEND_RESET ─► password{busy:"reset"} ─► RESET_SENT / FAIL
 *                         signedIn ──SIGNED_OUT──► email
 *   email / password ──GOOGLE──► redirecting (page leaves for Google; FAIL returns to email)
 *
 * `checking` exists so a returning visitor doesn't see the email form flash
 * before "You're signed in". Field values (email, password) stay as plain
 * component state; this machine only owns *where* the visitor is.
 */

export type LoginState =
  | { step: "checking" }
  | { step: "email"; error: string | null }
  | { step: "redirecting" }
  | { step: "password"; busy: "sign-in" | "reset" | null; error: string | null; notice: string | null }
  | { step: "signedIn"; email: string };

export type LoginEvent =
  | { type: "SESSION_FOUND"; email: string }
  | { type: "SESSION_NONE" }
  | { type: "EMAIL_OK" }
  | { type: "EDIT_EMAIL" }
  | { type: "SIGN_IN" }
  | { type: "SIGNED_IN"; email: string }
  | { type: "SEND_RESET" }
  | { type: "RESET_SENT"; notice: string }
  | { type: "FAIL"; message: string }
  | { type: "SIGNED_OUT" }
  | { type: "GOOGLE" };

export const loginEmail: LoginState = { step: "email", error: null };
const passwordIdle: LoginState = { step: "password", busy: null, error: null, notice: null };

export function loginReducer(s: LoginState, e: LoginEvent): LoginState {
  switch (e.type) {
    case "SESSION_FOUND":
      return s.step === "checking" ? { step: "signedIn", email: e.email } : s;
    case "SESSION_NONE":
      return s.step === "checking" ? loginEmail : s;
    case "EMAIL_OK":
      return s.step === "email" ? passwordIdle : s;
    case "EDIT_EMAIL":
      return s.step === "password" && !s.busy ? loginEmail : s;
    case "SIGN_IN":
      return s.step === "password" && !s.busy ? { ...s, busy: "sign-in", error: null, notice: null } : s;
    case "SEND_RESET":
      return s.step === "password" && !s.busy ? { ...s, busy: "reset", error: null, notice: null } : s;
    case "SIGNED_IN":
      return s.step === "password" ? { step: "signedIn", email: e.email } : s;
    case "RESET_SENT":
      return s.step === "password" ? { ...s, busy: null, notice: e.notice } : s;
    case "GOOGLE":
      if (s.step === "email" || (s.step === "password" && !s.busy)) return { step: "redirecting" };
      return s;
    case "FAIL":
      if (s.step === "redirecting") return { step: "email", error: e.message };
      if (s.step === "email") return { ...s, error: e.message };
      if (s.step === "password") return { ...s, busy: null, error: e.message, notice: null };
      return s;
    case "SIGNED_OUT":
      return s.step === "signedIn" ? loginEmail : s;
  }
}
