"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { sessionLoading, sessionReducer, type Account, type SessionState } from "@/lib/machines/session";
import { asAccount, getProfile, logout as apiLogout } from "@/lib/api/auth";

type AuthValue = {
  session: SessionState;
  /** Convenience: `session.status === "signedIn"`. */
  isLoggedIn: boolean;
  account: Account | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

/**
 * App-wide sign-in state, driven by Django's HttpOnly JWT cookie session.
 * <html data-auth="loading|signedIn|signedOut"> mirrors it for CSS, tests and agents.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, dispatch] = useReducer(sessionReducer, sessionLoading);

  useEffect(() => {
    let live = true;
    const resolve = () => getProfile().then((user) => live && dispatch({ type: "RESOLVED", account: asAccount(user) })).catch(() => live && dispatch({ type: "RESOLVED", account: null }));
    void resolve();
    const changed = () => { void resolve(); };
    window.addEventListener("fleetcast-auth-changed", changed);
    return () => {
      live = false;
      window.removeEventListener("fleetcast-auth-changed", changed);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.auth = session.status;
  }, [session.status]);

  const signOut = useCallback(async () => {
    // Mark it as deliberate first, so protected pages don't bounce to /login.
    dispatch({ type: "RESOLVED", account: null, byUser: true });
    try { await apiLogout(); } catch { /* local UI is signed out even if the network is unavailable */ }
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
