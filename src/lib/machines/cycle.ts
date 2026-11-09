/**
 * Auto-advancing sequence (carousels, step walkthroughs, "example match" tickers).
 *
 *            TICK / NEXT / PREV / GO
 *          ┌──────────────────────────┐
 *          ▼                          │
 *   ┌────────────┐  PAUSE(reason)  ┌────────┐
 *   │  playing   │ ──────────────► │ paused │  (any reason left in `pausedBy`)
 *   └────────────┘ ◄────────────── └────────┘
 *          │        RESUME(last)       │
 *          │ GO{stop:true}             │ GO{stop:true}
 *          ▼                           ▼
 *   ┌──────────────────────────────────────┐
 *   │ stopped (visitor took control; the    │
 *   │ sequence never auto-advances again)   │
 *   └──────────────────────────────────────┘
 *
 * Pause reasons are tracked as a set, so "hovered AND offscreen" needs both to
 * clear before playback resumes. Pure: no React, no timers. See useAutoCycle.
 */

export type PauseReason = "hover" | "focus" | "offscreen" | "hidden-tab" | "reduced-motion";

export type CycleState = {
  index: number;
  count: number;
  stopped: boolean;
  pausedBy: readonly PauseReason[];
};

export type CycleEvent =
  | { type: "TICK" }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "GO"; index: number; stop?: boolean }
  | { type: "PAUSE"; reason: PauseReason }
  | { type: "RESUME"; reason: PauseReason };

export type CycleStatus = "playing" | "paused" | "stopped";

const wrap = (i: number, count: number) => (count > 0 ? ((i % count) + count) % count : 0);

export function initCycle(count: number, pausedBy: readonly PauseReason[] = ["offscreen"]): CycleState {
  return { index: 0, count, stopped: false, pausedBy };
}

export function cycleStatus(s: CycleState): CycleStatus {
  if (s.stopped) return "stopped";
  return s.pausedBy.length ? "paused" : "playing";
}

export function cycleReducer(s: CycleState, e: CycleEvent): CycleState {
  switch (e.type) {
    case "TICK":
      // Late timer callbacks are harmless: only a playing sequence advances.
      return cycleStatus(s) === "playing" ? { ...s, index: wrap(s.index + 1, s.count) } : s;
    case "NEXT":
      return { ...s, index: wrap(s.index + 1, s.count) };
    case "PREV":
      return { ...s, index: wrap(s.index - 1, s.count) };
    case "GO": {
      const index = wrap(e.index, s.count);
      const stopped = s.stopped || !!e.stop;
      return index === s.index && stopped === s.stopped ? s : { ...s, index, stopped };
    }
    case "PAUSE":
      return s.pausedBy.includes(e.reason) ? s : { ...s, pausedBy: [...s.pausedBy, e.reason] };
    case "RESUME":
      return s.pausedBy.includes(e.reason) ? { ...s, pausedBy: s.pausedBy.filter((r) => r !== e.reason) } : s;
  }
}
