/**
 * Header overlays. Only one can be open at a time, so it is ONE value, not
 * four booleans (the old code allowed e.g. search + mobile drawer together).
 *
 *               OPEN_MENU / TOGGLE_MENU
 *   ┌──────┐ ─────────────────────────► menu(id) ──CLOSE_MENU / DISMISS_POPOVERS──┐
 *   │ none │ ──TOGGLE_LANG────────────► lang     ──DISMISS_POPOVERS / SELECT_LANG─┤
 *   │      │ ──TOGGLE_SEARCH──────────► search                                     │
 *   │      │ ──TOGGLE_MOBILE──────────► mobile(section) ──TOGGLE_SECTION(id)─┐     │
 *   └──────┘ ◄──────────────── CLOSE_ALL (Esc, route change) ◄─────────────┘ ◄───┘
 *
 * Click/toggle events replace whatever was open before; hover (OPEN_MENU) never
 * steals focus from search or the drawer.
 */

export type Overlay =
  | { kind: "none" }
  | { kind: "menu"; id: string }
  | { kind: "lang" }
  | { kind: "search" }
  | { kind: "mobile"; section: string | null };

export type OverlayEvent =
  /** Hover intent. Yields to search and the drawer, which the visitor opened on purpose. */
  | { type: "OPEN_MENU"; id: string }
  | { type: "TOGGLE_MENU"; id: string }
  /** Delayed hover-out: closes a menu, never search or the drawer. */
  | { type: "CLOSE_MENU" }
  | { type: "TOGGLE_LANG" }
  | { type: "SELECT_LANG" }
  | { type: "TOGGLE_SEARCH" }
  | { type: "TOGGLE_MOBILE" }
  | { type: "TOGGLE_SECTION"; id: string }
  /** Outside click or header hiding on scroll: closes the small popovers only. */
  | { type: "DISMISS_POPOVERS" }
  | { type: "CLOSE_ALL" };

export const overlayNone: Overlay = { kind: "none" };

export function overlayReducer(s: Overlay, e: OverlayEvent): Overlay {
  switch (e.type) {
    case "OPEN_MENU":
      if (s.kind === "search" || s.kind === "mobile") return s;
      return s.kind === "menu" && s.id === e.id ? s : { kind: "menu", id: e.id };
    case "TOGGLE_MENU":
      return s.kind === "menu" && s.id === e.id ? overlayNone : { kind: "menu", id: e.id };
    case "CLOSE_MENU":
      return s.kind === "menu" ? overlayNone : s;
    case "TOGGLE_LANG":
      return s.kind === "lang" ? overlayNone : { kind: "lang" };
    case "SELECT_LANG":
      return s.kind === "lang" ? overlayNone : s;
    case "TOGGLE_SEARCH":
      return s.kind === "search" ? overlayNone : { kind: "search" };
    case "TOGGLE_MOBILE":
      return s.kind === "mobile" ? overlayNone : { kind: "mobile", section: null };
    case "TOGGLE_SECTION":
      if (s.kind !== "mobile") return s;
      return { kind: "mobile", section: s.section === e.id ? null : e.id };
    case "DISMISS_POPOVERS":
      return s.kind === "menu" || s.kind === "lang" ? overlayNone : s;
    case "CLOSE_ALL":
      return s.kind === "none" ? s : overlayNone;
  }
}

/** Stable string for `data-overlay` (handy for CSS, tests and agents). */
export function overlayKey(s: Overlay): string {
  if (s.kind === "menu") return `menu:${s.id}`;
  if (s.kind === "mobile") return s.section ? `mobile:${s.section}` : "mobile";
  return s.kind;
}
