"use client";

import Link from "next/link";
import AccountMenu from "@/components/account/AccountMenu";
import type { Account } from "@/lib/machines/session";

/** Top bar of the signed-in app: quick action + the account menu (Dashboard, Settings, Sign out). */
export default function AccountBar({ account }: { account: Account }) {
  return (
    <header className="dash-bar">
      <p className="dash-bar__crumb">
        <Link href="/dashboard">Dashboard</Link>
      </p>
      <div className="dash-bar__right">
        <Link href="/contact" className="btn btn--orange btn--sm dash-bar__cta">
          + New campaign
        </Link>
        <AccountMenu account={account} />
      </div>
    </header>
  );
}
