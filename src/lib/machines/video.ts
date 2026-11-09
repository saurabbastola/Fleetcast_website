/**
 * Video player playback, driven by the <video> element's own media events.
 *
 *   idle ──PLAY──► playing ⇄ paused        (PLAY / PAUSE)
 *                    │
 *                    └──ENDED──► ended ──PLAY──► playing
 *
 * `origin` remembers who started playback. Only playback the page started by
 * itself ("auto") is paused/resumed when the player scrolls out of / into
 * view; once the visitor presses play or pause, the page leaves it alone.
 */

export type VideoStatus = "idle" | "playing" | "paused" | "ended";
export type VideoState = { status: VideoStatus; origin: "auto" | "user" };

export type VideoEvent =
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "ENDED" }
  /** The visitor pressed a control. */
  | { type: "USER" };

export const videoIdle: VideoState = { status: "idle", origin: "auto" };

export function videoReducer(s: VideoState, e: VideoEvent): VideoState {
  switch (e.type) {
    case "PLAY":
      return s.status === "playing" ? s : { ...s, status: "playing" };
    case "PAUSE":
      // Browsers fire `pause` right before `ended`; keep the more specific state.
      return s.status === "playing" ? { ...s, status: "paused" } : s;
    case "ENDED":
      return { ...s, status: "ended" };
    case "USER":
      return s.origin === "user" ? s : { ...s, origin: "user" };
  }
}
