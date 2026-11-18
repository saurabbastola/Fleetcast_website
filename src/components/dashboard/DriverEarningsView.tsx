"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api/client";
import { driverCampaignApi, type CampaignParticipation } from "@/lib/api/campaigns";

type Summary={broadcast_hours:number|null;impressions:number|null;earnings:number|null;measurement_status:string};
const money=(value:number|string|null)=>value==null?"Not available":Number(value).toLocaleString("en-US",{style:"currency",currency:"USD"});
const human=(s:string)=>s.replaceAll("_"," ").toLowerCase().replace(/\b\w/g,x=>x.toUpperCase());

export default function DriverEarningsView(){
  const [summary,setSummary]=useState<Summary|null>(null);const [items,setItems]=useState<CampaignParticipation[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
  useEffect(()=>{Promise.all([api<Summary>("/driver/dashboard/"),driverCampaignApi.mine()]).then(([s,rows])=>{setSummary(s);setItems(rows);}).catch(e=>setError(e instanceof ApiError?e.message:e.message||"Earnings could not be loaded.")).finally(()=>setLoading(false));},[]);
  if(loading)return <p className="api-state" role="status">Loading activity and earnings…</p>;
  if(error)return <div className="api-error" role="alert">{error}</div>;
  const completed=items.filter(item=>item.status==="COMPLETED");
  const evidence=summary?.measurement_status||"UNAVAILABLE";
  return <div className="dview"><section className="dview__hello"><div><h1>Activity & earnings</h1><p>Review campaign hours, estimated earnings, and available performance records.</p></div><Link className="btn btn--navy btn--sm" href="/dashboard/campaigns">Browse campaigns</Link></section>
    {evidence==="DEMO"||evidence==="ESTIMATED"?<p className="measurement-note">{evidence==="DEMO"?"DEMO SAMPLE DATA":"ESTIMATED · Driver timer only"} · Hours are recorded by the driver. Impressions are not independently verified.</p>:null}
    <section className="dview__metrics"><article className="metric"><p className="metric__label">Recorded broadcast hours</p><p className="metric__value metric__value--small">{summary?.broadcast_hours==null?"Not available":summary.broadcast_hours.toFixed(2)}</p></article><article className="metric"><p className="metric__label">Reported impressions</p><p className="metric__value metric__value--small">{summary?.impressions==null?"Not available":summary.impressions.toLocaleString()}</p></article><article className="metric"><p className="metric__label">Estimated compensation</p><p className="metric__value metric__value--small">{money(summary?.earnings??null)}</p></article></section>
    <section className="dcard dcard--wide"><header className="dcard__head"><h2>Campaign performance</h2></header>{items.length===0?<p className="api-empty">No campaign activity has been recorded yet.</p>:<div className="dtable__wrap"><table className="dtable"><thead><tr><th>Campaign</th><th>Status</th><th>Hours</th><th>Impressions</th><th>Rate</th><th>Estimated pay</th><th>Evidence</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><th>{item.campaign.name}{item.campaign.is_demo&&<span className="demo-badge">DEMO</span>}</th><td>{human(item.status)}</td><td>{item.hours.toFixed(2)}</td><td>{item.impressions==null?"Not available":item.impressions.toLocaleString()}</td><td>{money(item.campaign.compensation_rate||null)} / hr</td><td>{money(item.estimated_earnings)}</td><td>{item.measurement_status}</td></tr>)}</tbody></table></div>}</section>
    <section className="dcard dcard--wide"><header className="dcard__head"><h2>Completed campaigns</h2></header>{completed.length===0?<p className="api-empty">No completed campaigns yet.</p>:<ul className="driver-history">{completed.map(item=><li key={item.id}><strong>{item.campaign.name}</strong><span>{item.hours.toFixed(2)} hours · {item.measurement_status.toLowerCase()}</span><span>{money(item.estimated_earnings)} estimated</span></li>)}</ul>}</section>
  </div>;
}
