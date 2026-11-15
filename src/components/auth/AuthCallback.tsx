"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readAuthRedirectError, safeNext } from "@/components/auth/AuthUi";
import { Mark } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { dashboardPath } from "@/lib/api/auth";

/**
 * Django returns here after setting the HttpOnly application session cookies.
 */
export default function AuthCallback() {
  const { session, account } = useAuth();
  const router = useRouter();
  // Read once on mount, before anything rewrites the URL.
  const [urlError, setUrlError] = useState<string | null>(null);
  const [next, setNext] = useState("/dashboard");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(params.get("linked") === "1" ? "/dashboard/settings" : safeNext(params.get("next")));
    setUrlError(readAuthRedirectError(true));
  }, []);

  useEffect(() => {
    if (session.status === "signedIn") router.replace(account ? dashboardPath(account.role) : next);
  }, [session.status, next, router, account]);

  const failed = urlError ?? (session.status === "signedOut" ? "We couldn't finish signing you in. Please try again." : null);

  return (
    <div className="login">
      <main className="login__main">
        <div className="login-card" data-step={failed ? "error" : "checking"} aria-busy={!failed}>
          <div className="login-card__logo" aria-label="Fleetcast" role="img">
            <Mark className="login-card__mark" />
            <span>fleetcast</span>
          </div>
          {failed ? (
            <>
              <h1 className="login-card__title">Sign-in didn&rsquo;t finish</h1>
              <p className="login-card__error" role="alert">
                {failed}
              </p>
              <Link href="/login" className="login-btn">
                Back to log in
              </Link>
            </>
          ) : (
            <p className="login-card__sub login-card__checking" role="status">
              Signing you in…
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
