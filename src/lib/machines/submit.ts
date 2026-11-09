/**
 * Async form submission (contact form, playbook lead form).
 *
 *   idle ──SUBMIT──► submitting ──RESOLVE──► success ──RESET──► idle
 *    ▲                   │
 *    │                   └──REJECT(msg)──► error ──SUBMIT──► submitting
 *    └───────────────RESET───────────────────┘
 *
 * Guards that used to be missing:
 * - SUBMIT while submitting is ignored (no double posts).
 * - RESOLVE / REJECT outside `submitting` are ignored, so a response that
 *   lands after the form was reset or closed can't flip it to "success".
 */

export type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

export type SubmitEvent =
  | { type: "SUBMIT" }
  | { type: "RESOLVE" }
  | { type: "REJECT"; message: string }
  | { type: "RESET" };

export const submitIdle: SubmitState = { status: "idle" };

export function submitReducer(s: SubmitState, e: SubmitEvent): SubmitState {
  switch (e.type) {
    case "SUBMIT":
      return s.status === "submitting" ? s : { status: "submitting" };
    case "RESOLVE":
      return s.status === "submitting" ? { status: "success" } : s;
    case "REJECT":
      return s.status === "submitting" ? { status: "error", message: e.message } : s;
    case "RESET":
      return s.status === "idle" ? s : submitIdle;
  }
}
