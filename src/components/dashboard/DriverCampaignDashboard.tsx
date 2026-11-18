"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { driverCampaignApi, type Campaign, type CampaignParticipation } from "@/lib/api/campaigns";

type Summary = { vehicles?:number; pending_vehicles?:number; approved_vehicles?:number; campaigns?:number; broadcast_hours?:number|null; impressions?:number|null; earnings?:number|null; measurement_status?:string; current_advertisement?:CampaignParticipation|null };
const label = (value:string) => value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const money = (value:number|string|null|undefined) => value == null ? "Not available" : Number(value).toLocaleString("en-US", {style:"currency",currency:"USD"});
const time = (value:string) => new Intl.DateTimeFormat(undefined, {dateStyle:"medium", timeStyle:"short"}).format(new Date(value));

export default function DriverCampaignDashboard({summary}:{summary:Summary}) {
  const [available,setAvailable]=useState<Campaign[]>([]); const [mine,setMine]=useState<CampaignParticipation[]>([]);
  const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [busy,setBusy]=useState<string|number|null>(null); const [notice,setNotice]=useState("");
  const load=useCallback(async()=>{setLoading(true);setError("");try{const [open,own]=await Promise.all([driverCampaignApi.available(),driverCampaignApi.mine()]);setAvailable(open);setMine(own);}catch(e){setError(e instanceof ApiError?e.message:"We couldn't load campaigns. Please try again.");}finally{setLoading(false);}},[]);
  useEffect(()=>{void load();},[load]);
  const current=useMemo(()=>mine.find(item=>item.is_current)||summary.current_advertisement||null,[mine,summary.current_advertisement]);
  const active=mine.filter(item=>["ACCEPTED","ACTIVE"].includes(item.status));
  const history=mine.filter(item=>["COMPLETED","REJECTED","WITHDRAWN"].includes(item.status));
  const sessions=mine.flatMap(item=>item.broadcast_sessions.map(session=>({session, campaign:item.campaign}))).sort((a,b)=>Date.parse(b.session.started_at)-Date.parse(a.session.started_at));
  const action=async(id:Campaign["id"],fn:()=>Promise<unknown>,success:string)=>{setBusy(id);setError("");setNotice("");try{await fn();setNotice(success);await load();}catch(e){setError(e instanceof ApiError?e.message:"The campaign action could not be completed.");}finally{setBusy(null);}};

  return <div className="dview">
    <section className="dview__hello"><div><h1>Driver activity</h1><p>Find advertising opportunities, manage your active campaigns, and review your broadcast activity.</p></div><Link className="btn btn--orange btn--sm" href="/dashboard/vehicles/new">+ Register vehicle</Link></section>
    {error&&<div className="api-error" role="alert">{error}<button type="button" onClick={()=>void load()}>Try again</button></div>}{notice&&<p className="dform__ok" role="status">{notice}</p>}
    <section className="dview__metrics" aria-label="Driver summary">
      <article className="metric"><p className="metric__label">My campaigns</p><p className="metric__value metric__value--small">{active.length}</p></article>
      <article className="metric"><p className="metric__label">Broadcast hours</p><p className="metric__value metric__value--small">{summary.broadcast_hours==null?"Not available":summary.broadcast_hours.toFixed(2)}</p></article>
      <article className="metric"><p className="metric__label">Impressions</p><p className="metric__value metric__value--small">{summary.impressions==null?"Not available":summary.impressions.toLocaleString()}</p></article>
      <article className="metric"><p className="metric__label">Estimated earnings</p><p className="metric__value metric__value--small">{money(summary.earnings)}</p></article>
    </section>
    {(summary.measurement_status==="DEMO"||summary.measurement_status==="ESTIMATED")&&<p className="measurement-note">{summary.measurement_status==="DEMO"?"DEMO SAMPLE DATA":"ESTIMATED · Driver timer only"} · Broadcast activity is not verified by vehicle hardware or GPS.</p>}

    <section className="dcard dcard--wide driver-current" aria-labelledby="current-ad-title"><header className="dcard__head"><h2 id="current-ad-title">Currently broadcasting</h2><span className={`pill ${current?.open_session?"pill--live":current?"pill--draft":""}`}>{current?.open_session?"Broadcast active":current?"Selected · not broadcasting":"None selected"}</span></header>
      {current?<div className="driver-current__body">{current.campaign.advertisement_image_url&&<img src={current.campaign.advertisement_image_url} alt="Current campaign creative"/>}<div><h3>{current.campaign.name}</h3><p>{current.campaign.advertiser_name||"Advertiser"} · {current.campaign.advertisement_type||"Advertisement format not specified"}</p>{current.open_session?<p className="driver-live">Broadcast timer started {time(current.open_session.started_at)} · {current.open_session.hours.toFixed(2)} hours so far</p>:<p>This ad is selected, but no broadcast session is running. Start the timer from My campaigns when broadcasting begins.</p>}</div></div>:<p className="api-empty">Choose an accepted campaign to select its advertisement.</p>}
    </section>

    <section className="dcard dcard--wide" aria-labelledby="broadcast-log-title"><header className="dcard__head"><div><h2 id="broadcast-log-title">Broadcast activity</h2><p>Recorded sessions show which campaign was active, when it ran, and any impressions reported for that session.</p></div><span className="dcard__action">{sessions.length} sessions</span></header>
      {loading?<p className="api-state">Loading broadcast activity…</p>:sessions.length===0?<p className="api-empty">No broadcast sessions have been recorded yet. Start a session from My campaigns to build your activity history.</p>:<div className="dtable__wrap"><table className="dtable"><thead><tr><th>Advertisement / campaign</th><th>Time shown</th><th>Hours</th><th>Impressions</th><th>Measurement</th></tr></thead><tbody>{sessions.map(({session,campaign})=><tr key={session.id}><th scope="row">{campaign.name}{campaign.is_demo&&<span className="demo-badge">DEMO</span>}</th><td>{time(session.started_at)} – {session.ended_at?time(session.ended_at):"In progress"}</td><td>{session.hours.toFixed(2)}</td><td>{session.impressions==null?"Not recorded":session.impressions.toLocaleString()}</td><td>{label(session.measurement_status)}</td></tr>)}</tbody></table></div>}
      <p className="measurement-note">Impression counts are shown only when present on the session record. Driver timer sessions are not verified by vehicle hardware or GPS.</p>
    </section>

    <section className="dcard dcard--wide" aria-labelledby="available-campaigns-title"><header className="dcard__head"><div><h2 id="available-campaigns-title">Available campaigns</h2><p>Only active campaigns with open driver slots appear here.</p></div></header>
      {loading?<p className="api-state" role="status">Loading available campaigns…</p>:available.length===0?<div className="api-empty"><p>No campaigns are available right now.</p><button type="button" onClick={()=>void load()}>Refresh campaigns</button></div>:<div className="driver-campaign-grid">{available.map(campaign=>{
        const already=mine.find(item=>item.campaign.id===campaign.id&&!["WITHDRAWN","REJECTED"].includes(item.status));
        const possible=(Number(campaign.expected_broadcast_hours||0)*Number(campaign.compensation_rate||0));
        return <article className="driver-campaign" key={campaign.id}>
          <div className="driver-campaign__top">{campaign.advertisement_image_url?<img src={campaign.advertisement_image_url} alt=""/>:<div className="driver-campaign__image" aria-hidden="true">{campaign.industry?.slice(0,1)||"F"}</div>}<div><span className="driver-campaign__industry">{campaign.industry||"Advertising"}</span><h3>{campaign.name}</h3><p>{campaign.advertiser_name||"Advertiser"}</p></div></div>
          <p className="driver-campaign__description">{campaign.description}</p>
          <dl className="driver-campaign__facts"><div><dt>Format</dt><dd>{campaign.advertisement_type||"Not specified"}</dd></div><div><dt>Duration</dt><dd>{campaign.start_date||"Flexible"} – {campaign.end_date||"Flexible"}</dd></div><div><dt>Service area</dt><dd>{campaign.service_areas?.join(", ")||"Not specified"}</dd></div><div><dt>Open slots</dt><dd>{campaign.available_slots??"Not limited"}</dd></div><div><dt>Rate</dt><dd>{money(campaign.compensation_rate)} / broadcast hour</dd></div><div><dt>Potential pay</dt><dd>{money(possible)} estimated</dd></div><div><dt>Expected hours</dt><dd>{campaign.expected_broadcast_hours||"Not specified"}</dd></div><div><dt>Est. impressions</dt><dd>{campaign.estimated_impressions?.toLocaleString()||"Not available"}</dd></div></dl>
          {campaign.requirements&&<p className="driver-campaign__requirement"><strong>Requirements:</strong> {campaign.requirements}</p>}{campaign.eligibility_criteria&&<p className="driver-campaign__requirement"><strong>Eligibility:</strong> {campaign.eligibility_criteria}</p>}
          {campaign.is_demo&&<span className="demo-badge">DEMO CAMPAIGN</span>}
          {already?<p className="driver-campaign__applied">{label(already.status)}{already.status==="APPLIED"?" · awaiting advertiser review":""}</p>:<button className="btn btn--navy btn--sm" type="button" disabled={busy===campaign.id} onClick={()=>void action(campaign.id,()=>driverCampaignApi.apply(campaign.id),"Application sent to the advertiser.")}>{busy===campaign.id?"Applying…":"Apply to campaign"}</button>}
        </article>;
      })}</div>}
    </section>

    <section className="dcard dcard--wide" aria-labelledby="my-campaigns-title"><header className="dcard__head"><h2 id="my-campaigns-title">My campaigns</h2><Link className="dcard__action" href="/dashboard/earnings">View activity & earnings →</Link></header>
      {loading?<p className="api-state">Loading your campaigns…</p>:mine.length===0?<p className="api-empty">You haven't applied to a campaign yet.</p>:<div className="dtable__wrap"><table className="dtable"><thead><tr><th>Campaign</th><th>Advertiser</th><th>Status</th><th>Hours</th><th>Impressions</th><th>Estimated pay</th><th>Activity</th></tr></thead><tbody>{mine.map(item=><tr key={item.id}><th scope="row">{item.campaign.name}{item.campaign.is_demo&&<span className="demo-badge">DEMO</span>}</th><td>{item.campaign.advertiser_name||"—"}</td><td>{label(item.status)}{item.is_current&&" · Current"}</td><td>{item.hours.toFixed(2)}</td><td>{item.impressions==null?"Not available":item.impressions.toLocaleString()}</td><td>{money(item.estimated_earnings)}</td><td className="collection-actions">
          {item.status==="APPLIED"&&<button type="button" disabled={busy===item.campaign.id} onClick={()=>void action(item.campaign.id,()=>driverCampaignApi.withdraw(item.campaign.id),"Application withdrawn.")}>Withdraw</button>}
          {["ACCEPTED","ACTIVE"].includes(item.status)&&!item.is_current&&<button type="button" disabled={busy===item.campaign.id} onClick={()=>void action(item.campaign.id,()=>driverCampaignApi.switchTo(item.campaign.id),"Current advertisement updated.")}>Switch to this ad</button>}
          {["ACCEPTED","ACTIVE"].includes(item.status)&&!item.open_session&&<button type="button" disabled={busy===item.campaign.id} onClick={()=>void action(item.campaign.id,()=>driverCampaignApi.startBroadcast(item.campaign.id),"Broadcast timer started. Hours are driver-reported estimates.")}>Start hours timer</button>}
          {item.open_session&&<button type="button" disabled={busy===item.campaign.id} onClick={()=>void action(item.campaign.id,()=>driverCampaignApi.stopBroadcast(item.campaign.id),"Broadcast timer stopped.")}>Stop timer</button>}
        </td></tr>)}</tbody></table></div>}
    </section>
    {history.length>0&&<section className="dcard dcard--wide"><header className="dcard__head"><h2>Campaign history</h2></header><div className="dtable__wrap"><table className="dtable"><thead><tr><th>Campaign</th><th>Advertiser</th><th>Status</th><th>Recorded hours</th><th>Measurement</th></tr></thead><tbody>{history.map(item=><tr key={item.id}><th>{item.campaign.name}</th><td>{item.campaign.advertiser_name||"—"}</td><td>{label(item.status)}</td><td>{item.hours.toFixed(2)}</td><td>{item.measurement_status}</td></tr>)}</tbody></table></div></section>}
  </div>;
}
