"use client";

import { useCallback, useEffect, useMemo, useReducer, type FocusEvent } from "react";
import { cycleReducer, cycleStatus, initCycle, type PauseReason } from "@/lib/machines/cycle";

type Options = {
  count: number;
  /** Milliseconds to stay on a slide; a function lets one slide linger longer. */
  interval: number | ((index: number) => number);
  /** Usually from useInView({ once: false }). Offscreen sequences don't advance. */
  inView: boolean;
};

/**
 * Runs the pure `cycle` machine with real-world inputs: a timer, viewport
 * visibility, tab visibility and prefers-reduced-motion. Components get the
 * current index, a status for `data-status`, actions, and `pauseProps` to
 * spread on the element that should pause on hover/focus.
 */
export function useAutoCycle({ count, interval, inView }: Options) {
  const [state, dispatch] = useReducer(cycleReducer, count, (c) => initCycle(c));
  const status = cycleStatus(state);
  const delay = typeof interval === "function" ? interval(state.index) : interval;

  useEffect(() => {
    dispatch({ type: inView ? "RESUME" : "PAUSE", reason: "offscreen" });
  }, [inView]);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onVisibility = () => dispatch({ type: document.hidden ? "PAUSE" : "RESUME", reason: "hidden-tab" });
    const onMotion = () => dispatch({ type: motion.matches ? "PAUSE" : "RESUME", reason: "reduced-motion" });
    onVisibility();
    onMotion();
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", onMotion);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", onMotion);
    };
  }, []);

  useEffect(() => {
    if (status !== "playing") return;
    const t = window.setTimeout(() => dispatch({ type: "TICK" }), delay);
    return () => window.clearTimeout(t);
  }, [status, state.index, delay]);

  const go = useCallback((index: number, opts?: { stop?: boolean }) => dispatch({ type: "GO", index, stop: opts?.stop }), []);
  const next = useCallback(() => dispatch({ type: "NEXT" }), []);
  const prev = useCallback(() => dispatch({ type: "PREV" }), []);
  const pause = useCallback((reason: PauseReason) => dispatch({ type: "PAUSE", reason }), []);
  const resume = useCallback((reason: PauseReason) => dispatch({ type: "RESUME", reason }), []);

  const pauseProps = useMemo(
    () => ({
      onMouseEnter: () => pause("hover"),
      onMouseLeave: () => resume("hover"),
      onFocus: () => pause("focus"),
      onBlur: (e: FocusEvent<HTMLElement>) => {
        // Moving focus between children shouldn't count as leaving.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) resume("focus");
      },
    }),
    [pause, resume]
  );

  return { index: state.index, status, pausedBy: state.pausedBy, go, next, prev, pause, resume, pauseProps };
}
