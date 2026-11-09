"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import AccountBar from "@/components/dashboard/AccountBar";
import { Mark } from "@/components/Logo";
import { dashNav, type DashNavItem } from "@/content/dashboard";
import { useAuth } from "@/lib/auth";

function NavIcon({ name }: { name: DashNavItem["icon"] }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<DashNavItem["icon"], ReactNode> = {
    home: <path {...common} d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
    megaphone: <path {...common} d="M3 10v4h3l8 5V5L6 10zM18 9a4 4 0 0 1 0 6" />,
    truck: <path {...common} d="M2 6h11v10H2zM13 10h4l4 4v2h-8M6 19a2 2 0 1 0 0-.1M17 19a2 2 0 1 0 0-.1" />,
    brush: <path {...common} d="M14 4l6 6-8 8H6v-6zM4 20h4" />,
    chart: <path {...common} d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
    gear: (
      <>
        <circle {...common} cx="12" cy="12" r="3" />
        <path {...common} d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

/**
 * Signed-in app shell: sidebar + account bar around every /dashboard page.
 * Guards the area: while the session loads it shows a status line; signed-out
 * visitors are sent to /login. State comes from useAuth() (lib/machines/session.ts).
 */
export default function DashboardShell({ children }: { children: ReactNode }) {
  const { session, account } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only a missing/expired session goes to /login; "Sign out" takes people home instead.
    if (session.status === "signedOut" && !session.byUser) router.replace("/login");
  }, [session, router]);

  if (!account) {
    return (
      <div className="dash-gate" role="status" data-auth={session.status}>
        <Mark className="dash-gate__mark" />
        <p>
          {session.status === "signedOut"
            ? session.byUser
              ? "Signing you out…"
              : "Taking you to log in…"
            : "Loading your dashboard…"}
        </p>
      </div>
    );
  }

  return (
    <div className="dash">
      <aside className="dash__side" aria-label="Dashboard">
        <Link href="/dashboard" className="dash__brand" aria-label="Fleetcast dashboard">
          <Mark className="dash__mark" />
          <span>fleetcast</span>
        </Link>
        <nav className="dash__nav">
          <ul>
            {dashNav.map((item) => {
              const active = item.href === pathname;
              return (
                <li key={item.label}>
                  {item.href ? (
                    <Link href={item.href} className={`dash__link${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined}>
                      <NavIcon name={item.icon} />
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <span className="dash__link is-soon" aria-disabled="true">
                      <NavIcon name={item.icon} />
                      <span>{item.label}</span>
                      <em>Soon</em>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="dash__side-foot">
          <Link href="/contact">Need help? Talk to us</Link>
        </div>
      </aside>

      <div className="dash__main">
        <AccountBar account={account} />
        <main className="dash__content" id="main">
          {children}
        </main>
      </div>
    </div>
  );
}
