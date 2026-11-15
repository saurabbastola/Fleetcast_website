"use client";

import Link from "next/link";
import AccountMenu from "@/components/account/AccountMenu";
import type { Account } from "@/lib/machines/session";

/** Top bar of the signed-in app: quick action + the account menu (Dashboard, Settings, Sign out). */
export default function AccountBar({ account }: { account: Account }) {
  return (
    <header className="dash-bar">
      <p className="dash-bar__crumb">
        <Link href={account.role === "ADMIN" ? "/dashboard/admin" : "/dashboard"}>Dashboard</Link>
      </p>
      <div className="dash-bar__right">
        {account.role === "BUSINESS" && <Link href="/dashboard/campaigns/new" className="btn btn--orange btn--sm dash-bar__cta">+ New campaign</Link>}
        {account.role === "DRIVER" && <Link href="/dashboard/vehicles/new" className="btn btn--orange btn--sm dash-bar__cta">+ Register vehicle</Link>}
        <AccountMenu account={account} />
      </div>
    </header>
  );
}
