"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { useSubmit } from "@/lib/useSubmit";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called once the lead is stored, before the visitor closes the success screen. */
  onSuccess?: () => void;
  title: string;
  source: string;
};

/**
 * Email-capture modal used by the playbook pop-up. Posts to /api/leads (Supabase).
 * Submission state machine: lib/machines/submit.ts. Closing aborts a pending request.
 */
export default function LeadModal({ open, onClose, onSuccess, title, source }: Props) {
  const { state, submit, reset } = useSubmit("/api/leads");
  const first = useRef<HTMLInputElement | null>(null);
  const card = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => first.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // Keep Tab inside the dialog.
      if (e.key === "Tab" && card.current) {
        const f = card.current.querySelectorAll<HTMLElement>("button, input, select, textarea, a[href]");
        if (!f.length) return;
        const target = e.shiftKey ? f[f.length - 1] : f[0];
        const edge = e.shiftKey ? f[0] : f[f.length - 1];
        if (document.activeElement === edge) {
          e.preventDefault();
          target.focus();
        }
      }
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      reset();
      // Return focus to whatever opened the dialog, if it's still on screen.
      if (opener && !opener.closest('[aria-hidden="true"]')) opener.focus();
    };
  }, [open, onClose, reset]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const ok = await submit({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      company: String(form.get("company") ?? ""),
      source,
    });
    if (ok) onSuccess?.();
  };

  if (!open) return null;
  const sending = state.status === "submitting";

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-title"
      data-status={state.status}
      onMouseDown={onClose}
    >
      <div className="modal__card" ref={card} onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 3l14 14M17 3 3 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
        {state.status === "success" ? (
          <div className="modal__done" role="status">
            <h2 id="lead-title">Check your inbox</h2>
            <p>Thanks! We&rsquo;ll send &ldquo;{title}&rdquo; to you shortly.</p>
            <button type="button" className="btn btn--navy" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="form" aria-busy={sending}>
            <h2 id="lead-title" className="modal__title">
              {title}
            </h2>
            <p className="modal__text">Tell us where to send your free copy.</p>
            <label className="field">
              <span>Full name</span>
              <input ref={first} name="name" autoComplete="name" required />
            </label>
            <label className="field">
              <span>Work email</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label className="field">
              <span>Company</span>
              <input name="company" autoComplete="organization" />
            </label>
            {state.status === "error" && (
              <p className="form__error" role="alert">
                {state.message}
              </p>
            )}
            <button type="submit" className="btn btn--navy btn--block" disabled={sending}>
              {sending ? "Sending…" : "Send me the playbook"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
