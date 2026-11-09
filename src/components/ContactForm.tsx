"use client";

import type { FormEvent } from "react";
import { useSubmit } from "@/lib/useSubmit";

const ROLES = ["Marketer / Brand", "Agency", "Fleet owner", "Retailer", "Other"];

/** Contact form. Submission state machine: lib/machines/submit.ts. */
export default function ContactForm() {
  const { state, submit, reset } = useSubmit("/api/contact");
  const sending = state.status === "submitting";

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    if (await submit(Object.fromEntries(new FormData(formEl).entries()))) formEl.reset();
  };

  if (state.status === "success") {
    return (
      <div className="contact-card contact-card--done" role="status" data-status={state.status}>
        <h2>Thanks — we&rsquo;ll be in touch.</h2>
        <p>Someone from the Fleetcast team will reply within one business day.</p>
        <button type="button" className="btn btn--orange" onClick={reset}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form className="contact-card form" onSubmit={onSubmit} data-status={state.status} aria-busy={sending}>
      <h2 className="contact-card__title">Send us a message</h2>
      <div className="form__row">
        <label className="field">
          <span>First name*</span>
          <input name="firstName" autoComplete="given-name" required />
        </label>
        <label className="field">
          <span>Last name</span>
          <input name="lastName" autoComplete="family-name" />
        </label>
      </div>
      <label className="field">
        <span>Work email*</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <div className="form__row">
        <label className="field">
          <span>Company</span>
          <input name="company" autoComplete="organization" />
        </label>
        <label className="field">
          <span>I am a…</span>
          <select name="role" defaultValue="">
            <option value="" disabled>
              Select one
            </option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span>How can we help?</span>
        <textarea name="message" rows={4} />
      </label>
      <label className="hp" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      {state.status === "error" && (
        <p className="form__error" role="alert">
          {state.message}
        </p>
      )}
      <button type="submit" className="btn btn--orange btn--block btn--md" disabled={sending}>
        {sending ? "Sending…" : "Get in touch"}
      </button>
    </form>
  );
}
