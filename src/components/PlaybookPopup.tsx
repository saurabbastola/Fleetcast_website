"use client";

import { useCallback, useEffect, useReducer } from "react";
import LeadModal from "@/components/LeadModal";
import PlaybookCover from "@/components/PlaybookCover";
import { playbook } from "@/content/site";
import { playbookReducer, playbookWaiting } from "@/lib/machines/playbook";

const KEY = "fc_playbook_dismissed";
const DAYS = 7;

function snooze() {
  try {
    window.localStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* storage unavailable */
  }
}

/**
 * Bottom-right "ultimate playbook" slide-in, like a HubSpot pop-up CTA.
 * State machine: lib/machines/playbook.ts (waiting → visible → form → dismissed).
 */
export default function PlaybookPopup() {
  const [state, dispatch] = useReducer(playbookReducer, playbookWaiting);
  const visible = state.phase === "visible";

  useEffect(() => {
    let dismissedAt = 0;
    try {
      dismissedAt = Number(window.localStorage.getItem(KEY) || 0);
    } catch {
      dismissedAt = 0;
    }
    if (dismissedAt && Date.now() - dismissedAt < DAYS * 864e5) {
      dispatch({ type: "SNOOZED" });
      return;
    }
    // Desktop: slide in shortly after load. Phones: wait until the visitor scrolls past the hero.
    if (window.matchMedia("(min-width: 700px)").matches) {
      const t = window.setTimeout(() => dispatch({ type: "SHOW" }), 1400);
      return () => window.clearTimeout(t);
    }
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 1.2) {
        dispatch({ type: "SHOW" });
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dismiss = useCallback(() => {
    dispatch({ type: "DISMISS" });
    snooze();
  }, []);

  const closeForm = useCallback(() => dispatch({ type: "CLOSE_FORM" }), []);
  const succeeded = useCallback(() => {
    dispatch({ type: "SUCCEEDED" });
    snooze();
  }, []);

  return (
    <>
      <aside
        className={`playbook${visible ? " is-visible" : ""}`}
        aria-label="Free playbook"
        aria-hidden={!visible}
        data-phase={state.phase}
        inert={!visible}
      >
        <button type="button" className="playbook__close" onClick={dismiss} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 3l14 14M17 3 3 17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
        <div className="playbook__copy">
          <p className="playbook__title">{playbook.title}</p>
          <p className="playbook__text">{playbook.text}</p>
          <button type="button" className="btn btn--navy playbook__btn" onClick={() => dispatch({ type: "OPEN_FORM" })}>
            {playbook.cta}
          </button>
        </div>
        <div className="playbook__cover">
          <PlaybookCover eyebrow={playbook.coverEyebrow} title={playbook.coverTitle} />
        </div>
      </aside>
      <LeadModal
        open={state.phase === "form"}
        onClose={closeForm}
        onSuccess={succeeded}
        title={playbook.title}
        source="playbook-popup"
      />
    </>
  );
}
