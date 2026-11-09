/**
 * Transition tests for the pure state machines. No React, no DOM.
 * Run: npm test   (Node ≥ 23.6 runs TypeScript directly)
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cycleReducer, cycleStatus, initCycle, type CycleEvent, type CycleState } from "./cycle.ts";
import { loginEmail, loginReducer, type LoginEvent, type LoginState } from "./login.ts";
import { overlayKey, overlayNone, overlayReducer, type Overlay, type OverlayEvent } from "./overlay.ts";
import { playbookReducer, playbookWaiting, type PlaybookEvent, type PlaybookState } from "./playbook.ts";
import { submitIdle, submitReducer, type SubmitEvent, type SubmitState } from "./submit.ts";
import { videoIdle, videoReducer, type VideoEvent } from "./video.ts";

const run = <S, E>(reducer: (s: S, e: E) => S, s: S, ...events: E[]) => events.reduce(reducer, s);

describe("cycle", () => {
  const go = (s: CycleState, ...e: CycleEvent[]) => run(cycleReducer, s, ...e);

  it("starts paused offscreen and plays once visible", () => {
    const s = initCycle(4);
    assert.equal(cycleStatus(s), "paused");
    assert.equal(cycleStatus(go(s, { type: "RESUME", reason: "offscreen" })), "playing");
  });

  it("only advances on TICK while playing, and wraps around", () => {
    const playing = go(initCycle(3), { type: "RESUME", reason: "offscreen" });
    assert.equal(go(playing, { type: "TICK" }, { type: "TICK" }, { type: "TICK" }).index, 0);
    assert.equal(go(playing, { type: "PAUSE", reason: "hover" }, { type: "TICK" }).index, 0);
  });

  it("needs every pause reason cleared before resuming", () => {
    const s = go(initCycle(3), { type: "PAUSE", reason: "hover" }, { type: "RESUME", reason: "offscreen" });
    assert.equal(cycleStatus(s), "paused");
    assert.equal(cycleStatus(go(s, { type: "RESUME", reason: "hover" })), "playing");
  });

  it("GO with stop hands control to the visitor for good", () => {
    const s = go(initCycle(4, []), { type: "GO", index: 2, stop: true }, { type: "TICK" }, { type: "GO", index: 1 });
    assert.equal(cycleStatus(s), "stopped");
    assert.equal(s.index, 1);
  });

  it("PREV wraps backwards", () => {
    assert.equal(go(initCycle(4), { type: "PREV" }).index, 3);
  });
});

describe("submit", () => {
  const go = (...e: SubmitEvent[]) => run<SubmitState, SubmitEvent>(submitReducer, submitIdle, ...e);

  it("happy path", () => {
    assert.deepEqual(go({ type: "SUBMIT" }, { type: "RESOLVE" }), { status: "success" });
  });
  it("error then retry", () => {
    assert.deepEqual(go({ type: "SUBMIT" }, { type: "REJECT", message: "x" }), { status: "error", message: "x" });
    assert.deepEqual(go({ type: "SUBMIT" }, { type: "REJECT", message: "x" }, { type: "SUBMIT" }), { status: "submitting" });
  });
  it("ignores a response that arrives after RESET", () => {
    assert.deepEqual(go({ type: "SUBMIT" }, { type: "RESET" }, { type: "RESOLVE" }), { status: "idle" });
  });
});

describe("overlay (header)", () => {
  const go = (...e: OverlayEvent[]) => run<Overlay, OverlayEvent>(overlayReducer, overlayNone, ...e);

  it("only one overlay is ever open", () => {
    assert.equal(go({ type: "TOGGLE_SEARCH" }, { type: "TOGGLE_MOBILE" }).kind, "mobile");
    assert.equal(go({ type: "TOGGLE_LANG" }, { type: "TOGGLE_MENU", id: "Solutions" }).kind, "menu");
  });
  it("hover never closes search or the drawer", () => {
    assert.equal(go({ type: "TOGGLE_SEARCH" }, { type: "OPEN_MENU", id: "About" }).kind, "search");
    assert.equal(go({ type: "TOGGLE_MOBILE" }, { type: "OPEN_MENU", id: "About" }).kind, "mobile");
  });
  it("delayed hover-out closes menus only", () => {
    assert.equal(go({ type: "TOGGLE_SEARCH" }, { type: "CLOSE_MENU" }).kind, "search");
    assert.equal(go({ type: "OPEN_MENU", id: "About" }, { type: "CLOSE_MENU" }).kind, "none");
  });
  it("drawer sections are an accordion that resets when the drawer reopens", () => {
    const s = go({ type: "TOGGLE_MOBILE" }, { type: "TOGGLE_SECTION", id: "Products" });
    assert.equal(overlayKey(s), "mobile:Products");
    assert.equal(overlayKey(run(overlayReducer, s, { type: "TOGGLE_MOBILE" }, { type: "TOGGLE_MOBILE" })), "mobile");
  });
  it("Escape closes everything", () => {
    assert.equal(go({ type: "TOGGLE_MOBILE" }, { type: "CLOSE_ALL" }).kind, "none");
  });
});

describe("login", () => {
  const go = (s: LoginState, ...e: LoginEvent[]) => run(loginReducer, s, ...e);

  it("returning visitor skips the form", () => {
    assert.deepEqual(go({ step: "checking" }, { type: "SESSION_FOUND", email: "a@b.co" }), { step: "signedIn", email: "a@b.co" });
  });
  it("sign-in failure keeps the visitor on the password step", () => {
    const s = go(loginEmail, { type: "EMAIL_OK" }, { type: "SIGN_IN" }, { type: "FAIL", message: "Wrong" });
    assert.deepEqual(s, { step: "password", busy: null, error: "Wrong", notice: null });
  });
  it("can't edit the email or double-submit while busy", () => {
    const busy = go(loginEmail, { type: "EMAIL_OK" }, { type: "SIGN_IN" });
    assert.equal(go(busy, { type: "EDIT_EMAIL" }), busy);
    assert.equal(go(busy, { type: "SEND_RESET" }), busy);
  });
  it("a reset notice replaces any error", () => {
    const s = go(loginEmail, { type: "EMAIL_OK" }, { type: "FAIL", message: "x" }, { type: "SEND_RESET" }, { type: "RESET_SENT", notice: "sent" });
    assert.deepEqual(s, { step: "password", busy: null, error: null, notice: "sent" });
  });
});

describe("video", () => {
  const go = (...e: VideoEvent[]) => run(videoReducer, videoIdle, ...e);
  it("pause right before ended keeps ended", () => {
    assert.equal(go({ type: "PLAY" }, { type: "ENDED" }, { type: "PAUSE" }).status, "ended");
  });
  it("remembers the visitor took over", () => {
    assert.equal(go({ type: "PLAY" }, { type: "USER" }, { type: "PAUSE" }).origin, "user");
  });
});

describe("playbook pop-up", () => {
  const go = (...e: PlaybookEvent[]) => run<PlaybookState, PlaybookEvent>(playbookReducer, playbookWaiting, ...e);
  it("closing the form without converting brings the slide-in back", () => {
    assert.deepEqual(go({ type: "SHOW" }, { type: "OPEN_FORM" }, { type: "CLOSE_FORM" }), { phase: "visible" });
  });
  it("converting dismisses it for good", () => {
    assert.deepEqual(go({ type: "SHOW" }, { type: "OPEN_FORM" }, { type: "SUCCEEDED" }, { type: "CLOSE_FORM" }), { phase: "dismissed" });
  });
  it("a snoozed pop-up never shows", () => {
    assert.deepEqual(go({ type: "SNOOZED" }, { type: "SHOW" }), { phase: "dismissed" });
  });
});
