"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AccountMenu from "@/components/account/AccountMenu";
import { api, ApiError } from "@/lib/api/client";
import type { Account } from "@/lib/machines/session";

/** Top bar of the signed-in app: quick action + the account menu (Dashboard, Settings, Sign out). */
export default function AccountBar({ account }: { account: Account }) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");
  const switchWorkspace = async (role: Account["role"]) => {
    if (role === account.role || switching) return;
    setSwitching(true); setError("");
    try {
      await api("/auth/workspaces/", { method:"POST", body:JSON.stringify({role}) });
      window.dispatchEvent(new Event("fleetcast-auth-changed"));
      router.replace(role === "ADMIN" ? "/dashboard/admin" : "/dashboard");
      router.refresh();
    } catch (e) { setError(e instanceof ApiError ? e.message : "Workspace could not be changed."); }
    finally { setSwitching(false); }
  };
  const workspaceLabel = (role: Account["role"]) => role === "BUSINESS" ? "Advertiser" : role === "DRIVER" ? "Fleet owner" : "Administrator";
  return (
    <header className="dash-bar">
      <p className="dash-bar__crumb">
        <Link href={account.role === "ADMIN" ? "/dashboard/admin" : "/dashboard"}>Dashboard</Link>
      </p>
      <div className="dash-bar__right">
        {account.roles.length > 1 && <label className="workspace-switch"><span className="sr-only">Active workspace</span><select aria-label="Active workspace" value={account.role} disabled={switching} onChange={(e)=>void switchWorkspace(e.target.value as Account["role"])}>{account.roles.map((role)=><option key={role} value={role}>{workspaceLabel(role)}</option>)}</select></label>}
        {account.role === "BUSINESS" && <Link href="/dashboard/campaigns/new" className="btn btn--orange btn--sm dash-bar__cta">+ New campaign</Link>}
        {account.role === "DRIVER" && <Link href="/dashboard/vehicles/new" className="btn btn--orange btn--sm dash-bar__cta">+ Register vehicle</Link>}
        <AccountMenu account={account} />
      </div>
      {error&&<p className="workspace-switch__error" role="alert">{error}</p>}
    </header>
  );
}
