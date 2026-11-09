/**
 * Sign-up card.
 *
 *   form ──CREATE──► form{busy:"create"} ──NEEDS_VERIFY(email)──► verify ──VERIFY──► verify{busy:"verify"}
 *    │  ▲                  │                                      │  ▲  │                    │
 *    │  └────FAIL(msg)─────┘                                      │  │  └─RESEND─► {busy:"resend"} ─RESENT─┘
 *    │                     └──VERIFIED (project auto-confirms)──┐ │  └──────────FAIL(msg)────────┘
 *    │ GOOGLE ─► form{busy:"google"} (page leaves for Google)   │ └──BACK──► form
 *    ▼                                                          ▼
 *                                                     done(email) ◄──VERIFIED──
 *
 * Field values live in the component; this machine only owns the step and feedback.
 */

export type SignupState =
  | { step: "form"; busy: "create" | "google" | null; error: string | null }
  | { step: "verify"; email: string; busy: "verify" | "resend" | null; error: string | null; notice: string | null }
  | { step: "done"; email: string };

export type SignupEvent =
  | { type: "CREATE" }
  | { type: "GOOGLE" }
  | { type: "NEEDS_VERIFY"; email: string }
  | { type: "VERIFY" }
  | { type: "RESEND" }
  | { type: "RESENT"; notice: string }
  | { type: "VERIFIED"; email: string }
  | { type: "FAIL"; message: string }
  | { type: "BACK" };

export const signupForm: SignupState = { step: "form", busy: null, error: null };

export function signupReducer(s: SignupState, e: SignupEvent): SignupState {
  switch (e.type) {
    case "CREATE":
      return s.step === "form" && !s.busy ? { ...s, busy: "create", error: null } : s;
    case "GOOGLE":
      return s.step === "form" && !s.busy ? { ...s, busy: "google", error: null } : s;
    case "NEEDS_VERIFY":
      return s.step === "form" && s.busy === "create"
        ? { step: "verify", email: e.email, busy: null, error: null, notice: null }
        : s;
    case "VERIFY":
      return s.step === "verify" && !s.busy ? { ...s, busy: "verify", error: null, notice: null } : s;
    case "RESEND":
      return s.step === "verify" && !s.busy ? { ...s, busy: "resend", error: null, notice: null } : s;
    case "RESENT":
      return s.step === "verify" ? { ...s, busy: null, notice: e.notice } : s;
    case "VERIFIED":
      return (s.step === "form" && s.busy === "create") || (s.step === "verify" && s.busy === "verify")
        ? { step: "done", email: e.email }
        : s;
    case "FAIL":
      if (s.step === "form") return { ...s, busy: null, error: e.message };
      if (s.step === "verify") return { ...s, busy: null, error: e.message, notice: null };
      return s;
    case "BACK":
      return s.step === "verify" && !s.busy ? signupForm : s;
  }
}
