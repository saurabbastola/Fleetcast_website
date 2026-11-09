"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { submitIdle, submitReducer } from "@/lib/machines/submit";

const NETWORK_ERROR = "We couldn't reach Fleetcast. Check your connection and try again.";

class ServerError extends Error {}

/**
 * Runs the pure `submit` machine around a JSON POST. In-flight requests are
 * aborted on reset/unmount, and a second submit while one is pending is a no-op.
 * Resolves to true on success so callers can react (e.g. reset the form).
 */
export function useSubmit(url: string) {
  const [state, dispatch] = useReducer(submitReducer, submitIdle);
  const inflight = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    inflight.current?.abort();
    inflight.current = null;
  }, []);

  useEffect(() => abort, [abort]);

  const submit = useCallback(
    async (body: Record<string, unknown>): Promise<boolean> => {
      if (inflight.current) return false;
      const ctrl = new AbortController();
      inflight.current = ctrl;
      dispatch({ type: "SUBMIT" });
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) throw new ServerError(data.error || "Something went wrong. Please try again.");
        dispatch({ type: "RESOLVE" });
        return true;
      } catch (err) {
        if (ctrl.signal.aborted) return false;
        dispatch({ type: "REJECT", message: err instanceof ServerError ? err.message : NETWORK_ERROR });
        return false;
      } finally {
        if (inflight.current === ctrl) inflight.current = null;
      }
    },
    [url]
  );

  const reset = useCallback(() => {
    abort();
    dispatch({ type: "RESET" });
  }, [abort]);

  return { state, submit, reset };
}
