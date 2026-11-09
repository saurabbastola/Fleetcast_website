"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { sessionLoading, sessionReducer, toAccount, type Account, type SessionState } from "@/lib/machines/session";
import { getBrowserSupabase } from "@/lib/supabase";

type AuthValue = {
  session: SessionState;
  /** Convenience: `session.status === "signedIn"`. */
  isLoggedIn: boolean;
  account: Account | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

/**
 * App-wide sign-in state, driven by the real Supabase session (machine:
 * lib/machines/session.ts). Mounted once in the root layout; read it with useAuth().
 * <html data-auth="loading|signedIn|signedOut"> mirrors it for CSS, tests and agents.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, dispatch] = useReducer(sessionReducer, sessionLoading);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      dispatch({ type: "RESOLVED", account: null });
      return;
    }
    let live = true;
    supabase.auth
      .getSession()
      .then(({ data }) => live && dispatch({ type: "RESOLVED", account: toAccount(data.session?.user) }))
      .catch(() => live && dispatch({ type: "RESOLVED", account: null }));
    // Sign-in, sign-out, Google redirects, profile edits and other tabs all arrive here.
    // (Only dispatch inside this callback: Supabase warns against awaiting its own calls in it.)
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      if (live) dispatch({ type: "RESOLVED", account: toAccount(s?.user) });
    });
    return () => {
      live = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.auth = session.status;
  }, [session.status]);

  const signOut = useCallback(async () => {
    // Mark it as deliberate first, so protected pages don't bounce to /login.
    dispatch({ type: "RESOLVED", account: null, byUser: true });
    await getBrowserSupabase()?.auth.signOut();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      isLoggedIn: session.status === "signedIn",
      account: session.status === "signedIn" ? session.account : null,
      signOut,
    }),
    [session, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be used inside <AuthProvider> (it's mounted in app/layout.tsx).");
  return ctx;
}
