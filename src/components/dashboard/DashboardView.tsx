"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { firstName } from "@/lib/machines/session";
import { api, ApiError } from "@/lib/api/client";
import { rows } from "@/lib/api/resources";
import type { Campaign, Page } from "@/lib/api/campaigns";

type Summary = {campaigns?:number; active_campaigns?:number; advertisements?:number; impressions?:number|null; qr_scans?:number|null; vehicles?:number; pending_vehicles?:number; approved_vehicles?:number; earnings?:number|null; assigned_advertisements?:number|null; businesses?:number; drivers?:number};
const fmt = (n?: number | null) => n == null ? "Not available" : n.toLocaleString("en-US");
const label = (s: string) => s.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export default function DashboardView() {
  const { account } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null); const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!account) return;
    setLoading(true); setError("");
    try {
      if (account.role === "DRIVER") setSummary(await api<Summary>("/driver/dashboard/"));
      else if (account.role === "ADMIN") setSummary(await api<Summary>("/admin/dashboard/"));
      else {
        const [s, c] = await Promise.all([api<Summary>("/business/dashboard/"), api<Page<Campaign>|Campaign[]>("/campaigns/?page_size=5&ordering=-created_at")]);
        setSummary(s); setCampaigns(rows(c).slice(0, 5));
      }
    } catch (e) { setError(e instanceof ApiError ? e.message : "We couldn't load your dashboard. Try again."); }
    finally { setLoading(false); }
  }, [account]);
  useEffect(() => { void load(); }, [load]);
  if (!account) return null;

  const cards = account.role === "DRIVER"
    ? [{label:"Vehicles", value:fmt(summary?.vehicles)}, {label:"Pending review", value:fmt(summary?.pending_vehicles)}, {label:"Approved vehicles", value:fmt(summary?.approved_vehicles)}, {label:"Earnings", value:fmt(summary?.earnings)}]
    : account.role === "ADMIN"
      ? [{label:"Businesses", value:fmt(summary?.businesses)}, {label:"Drivers", value:fmt(summary?.drivers)}, {label:"Vehicles", value:fmt(summary?.vehicles)}, {label:"Campaigns", value:fmt(summary?.campaigns)}]
      : [{label:"Campaigns", value:fmt(summary?.campaigns)}, {label:"Active campaigns", value:fmt(summary?.active_campaigns)}, {label:"Advertisements", value:fmt(summary?.advertisements)}, {label:"Impressions", value:fmt(summary?.impressions)}];

  return <div className="dview">
    <section className="dview__hello"><div><h1>Welcome back, {firstName(account)}</h1><p>{account.role === "DRIVER" ? "Manage your profile, vehicles, and verification." : account.role === "ADMIN" ? "Review platform activity and pending approvals." : "Manage your campaigns and advertising creative."}</p></div><Link className="btn btn--orange btn--sm" href={account.role === "DRIVER" ? "/dashboard/vehicles" : account.role === "ADMIN" ? "/dashboard/admin/businesses" : "/dashboard/campaigns/new"}>{account.role === "DRIVER" ? "+ Register vehicle" : account.role === "ADMIN" ? "Review businesses" : "+ New campaign"}</Link></section>
    {loading ? <p className="api-state" role="status">Loading dashboard…</p> : error ? <div className="api-error" role="alert">{error} <button type="button" onClick={() => void load()}>Try again</button></div> : <>
      <section className="dview__metrics" aria-label="Account summary">{cards.map((m) => <article key={m.label} className="metric"><p className="metric__label">{m.label}</p><p className="metric__value metric__value--small">{m.value}</p></article>)}</section>
      {account.role === "BUSINESS" && <section className="dcard dcard--wide" aria-labelledby="campaigns-title"><header className="dcard__head"><h2 id="campaigns-title">Campaigns</h2><Link href="/dashboard/campaigns" className="dcard__action">Manage campaigns →</Link></header>
        {campaigns.length ? <div className="dtable__wrap"><table className="dtable"><thead><tr><th>Campaign</th><th>Budget</th><th>Dates</th><th>Status</th><th>Impressions</th><th>QR scans</th></tr></thead><tbody>{campaigns.map((c) => <tr key={c.id}><th scope="row">{c.name}</th><td>{Number(c.budget).toLocaleString("en-US",{style:"currency",currency:"USD"})}</td><td>{c.start_date || "—"}{c.end_date ? ` – ${c.end_date}` : ""}</td><td><span className="pill pill--draft">{label(c.status)}</span></td><td>Not available</td><td>Not available</td></tr>)}</tbody></table></div> : <div className="api-empty"><p>No campaigns yet.</p><Link href="/dashboard/campaigns/new">Create your first campaign</Link></div>}
      </section>}
      {account.role === "DRIVER" && <section className="dcard"><header className="dcard__head"><h2>Your vehicles</h2><Link href="/dashboard/vehicles" className="dcard__action">Manage vehicles →</Link></header><p className="api-empty">Assigned advertisements and earnings are not available yet.</p></section>}
      {account.role === "ADMIN" && <section className="dcard"><header className="dcard__head"><h2>Platform summary</h2><Link href="/dashboard/admin/businesses" className="dcard__action">Manage accounts →</Link></header><p className="api-empty">Impression and revenue reporting is not implemented.</p></section>}
    </>}
  </div>;
}
