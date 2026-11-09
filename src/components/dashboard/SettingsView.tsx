"use client";

import { useReducer, useState, type FormEvent } from "react";
import { Avatar, useSignOutToHome } from "@/components/account/AccountMenu";
import { useAuth } from "@/lib/auth";
import { submitIdle, submitReducer } from "@/lib/machines/submit";
import { getBrowserSupabase } from "@/lib/supabase";

/**
 * Profile settings. Saving updates the Supabase user (so the header updates at
 * once) and the user's row in public.profiles (supabase/profiles.sql).
 * Submission state reuses the submit machine (lib/machines/submit.ts).
 */
export default function SettingsView() {
  const { account } = useAuth();
  const [name, setName] = useState(account?.name ?? "");
  const [state, dispatch] = useReducer(submitReducer, submitIdle);
  const signOutToHome = useSignOutToHome();
  if (!account) return null;
  const saving = state.status === "submitting";

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    const fullName = name.trim();
    if (!fullName) return;
    if (!supabase) {
      dispatch({ type: "SUBMIT" });
      return dispatch({ type: "REJECT", message: "Supabase isn't connected." });
    }
    dispatch({ type: "SUBMIT" });
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
    if (error) return dispatch({ type: "REJECT", message: "We couldn't save your name. Please try again." });
    // Keep the profiles table in sync. If profiles.sql hasn't been run yet, the account still updates.
    await supabase.from("profiles").update({ full_name: fullName }).eq("id", account.id);
    dispatch({ type: "RESOLVE" });
  };

  return (
    <div className="dview">
      <section className="dview__hello">
        <div>
          <h1>Settings</h1>
          <p>Manage your profile and how you sign in.</p>
        </div>
      </section>

      <div className="dview__grid">
        <section className="dcard dcard--wide" aria-labelledby="profile-title">
          <header className="dcard__head">
            <h2 id="profile-title">Profile</h2>
          </header>
          <form className="dform" onSubmit={save} data-status={state.status}>
            <div className="dform__who">
              <Avatar account={account} size={56} />
              <div>
                <strong>{account.name}</strong>
                <span>{account.email}</span>
              </div>
            </div>
            <label className="field">
              <span>Full name</span>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (state.status !== "idle") dispatch({ type: "RESET" });
                }}
                autoComplete="name"
                required
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input value={account.email} readOnly aria-readonly="true" />
            </label>
            <p className="dform__hint">
              Signed in with <strong>{account.provider === "google" ? "Google" : "email and password"}</strong>.
            </p>
            {state.status === "error" && (
              <p className="form__error" role="alert">
                {state.message}
              </p>
            )}
            {state.status === "success" && (
              <p className="dform__ok" role="status">
                Saved.
              </p>
            )}
            <div className="dform__actions">
              <button type="submit" className="btn btn--navy btn--sm" disabled={saving || name.trim() === account.name}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </section>

        <section className="dcard dcard--wide" aria-labelledby="session-title">
          <header className="dcard__head">
            <h2 id="session-title">Session</h2>
          </header>
          <p className="dform__hint">Sign out of Fleetcast on this device.</p>
          <div className="dform__actions">
            <button type="button" className="btn btn--sm dform__out" onClick={() => void signOutToHome()}>
              Sign out
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
