/**
 * Playbook pop-up (bottom-right slide-in + its email form).
 *
 *   waiting ──SHOW──► visible ──OPEN_FORM──► form ──CLOSE_FORM──► visible
 *      │                 │                    │ SUCCEEDED (form{converted})
 *      │                 └──DISMISS──┐        └──CLOSE_FORM when converted──┐
 *      └──SNOOZED (dismissed recently)──► dismissed ◄───────────────────────┘
 *
 * The slide-in hides while the form is open, and a visitor who already gave
 * their email is never shown the pop-up again (it used to linger).
 */

export type PlaybookState =
  | { phase: "waiting" }
  | { phase: "visible" }
  | { phase: "form"; converted: boolean }
  | { phase: "dismissed" };

export type PlaybookEvent =
  | { type: "SHOW" }
  | { type: "SNOOZED" }
  | { type: "OPEN_FORM" }
  | { type: "SUCCEEDED" }
  | { type: "CLOSE_FORM" }
  | { type: "DISMISS" };

export const playbookWaiting: PlaybookState = { phase: "waiting" };

export function playbookReducer(s: PlaybookState, e: PlaybookEvent): PlaybookState {
  switch (e.type) {
    case "SHOW":
      return s.phase === "waiting" ? { phase: "visible" } : s;
    case "SNOOZED":
      return s.phase === "waiting" ? { phase: "dismissed" } : s;
    case "OPEN_FORM":
      return s.phase === "visible" ? { phase: "form", converted: false } : s;
    case "SUCCEEDED":
      return s.phase === "form" ? { phase: "form", converted: true } : s;
    case "CLOSE_FORM":
      if (s.phase !== "form") return s;
      return s.converted ? { phase: "dismissed" } : { phase: "visible" };
    case "DISMISS":
      return s.phase === "dismissed" ? s : { phase: "dismissed" };
  }
}
