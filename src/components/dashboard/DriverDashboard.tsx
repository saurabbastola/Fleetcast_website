import Link from "next/link";
import { firstName } from "@/lib/machines/session";
import type { DriverEvent } from "@/lib/api/drivers";
import type { Account } from "@/lib/machines/session";

export type DriverSummary = {
  broadcast_hours: number; advertisements_displayed: number | null; estimated_impressions: number;
  verified_impressions: number | null; demo_impressions: number | null; earnings: string | number;
  is_broadcasting: boolean; last_advertisement: DriverEvent | null; recent_activity: DriverEvent[];
  measurement_status: string;
};

const money=(value:number|string|null|undefined)=>value==null?"$0.00":Number(value).toLocaleString("en-US",{style:"currency",currency:"USD"});
const date=(value:string)=>new Intl.DateTimeFormat(undefined,{dateStyle:"medium"}).format(new Date(value));
const clock=(value:string|null)=>value?new Intl.DateTimeFormat(undefined,{hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(new Date(value)):"In progress";
const duration=(seconds:number)=>{const minutes=Math.floor(seconds/60);const rest=seconds%60;return `${minutes}m ${rest}s`;};

export default function DriverDashboard({account,summary,loading,error,onRetry}:{account:Account;summary:DriverSummary|null;loading:boolean;error:string;onRetry:()=>void}){
  const metrics:Array<[string,string]>=[
    ["Broadcasting hours",summary?summary.broadcast_hours.toFixed(2):"—"],
    ["Advertisement plays",summary?(summary.advertisements_displayed==null?"Not reported":summary.advertisements_displayed.toLocaleString()):"—"],
    ["Estimated impressions",summary?(summary.estimated_impressions==null?"Not available":summary.estimated_impressions.toLocaleString()):"—"],
    ["Verified impressions",summary?(summary.verified_impressions==null?"Not available":summary.verified_impressions.toLocaleString()):"—"],
    ["Total earnings",summary?money(summary.earnings):"—"],
    ["Broadcast status",summary?(summary.is_broadcasting?"Session active":"Not active"):"—"],
  ];
  if(summary?.demo_impressions!=null)metrics.splice(4,0,["Demo sample impressions",summary.demo_impressions.toLocaleString()]);
  return <div className="dview driver-home">
    <section className="dview__hello"><div><h1>Welcome back, {firstName(account)}</h1><p>Your vehicle advertising activity and performance.</p></div><Link className="btn btn--navy btn--sm" href="/dashboard/earnings">View earnings</Link></section>
    {loading?<p className="api-state" role="status">Loading your advertising activity…</p>:error?<div className="api-error" role="alert">{error} <button type="button" onClick={onRetry}>Try again</button></div>:summary&&<>
      <section className="dview__metrics driver-home__metrics" aria-label="Advertising activity summary">{metrics.map(([label,value])=><article className="metric" key={label}><p className="metric__label">{label}</p><p className="metric__value metric__value--small">{value}</p></article>)}</section>
      {summary.measurement_status==="DEMO"&&<p className="measurement-note">DEMO SAMPLE DATA · These records illustrate the activity and earnings workflow. They are not verified vehicle broadcasts or measured impressions.</p>}
      <section className="dcard dcard--wide driver-home__last"><header className="dcard__head"><div><h2>Last advertisement displayed</h2><p>{summary.is_broadcasting?"An advertisement is currently broadcasting.":"Most recent recorded vehicle advertisement."}</p></div><span className={`pill ${summary.is_broadcasting?"pill--live":"pill--draft"}`}>{summary.is_broadcasting?"Broadcasting":"Stopped"}</span></header>
        {summary.last_advertisement?<ActivityRow event={summary.last_advertisement}/>:<p className="api-empty">No advertising activity has been recorded for your vehicles yet.</p>}
      </section>
      <section className="dcard dcard--wide" aria-labelledby="driver-recent-activity"><header className="dcard__head"><div><h2 id="driver-recent-activity">Recent Advertising Activity</h2><p>Each row is one recorded advertisement interval. DEMO records are sample data.</p></div><Link href="/dashboard/earnings" className="dcard__action">Earnings history →</Link></header>
        {!summary.recent_activity.length?<p className="api-empty">No advertisements have been displayed yet.</p>:<div className="driver-event-list">{summary.recent_activity.map(event=><ActivityRow key={event.id} event={event}/>)}</div>}
      </section>
    </>}
  </div>;
}

function ActivityRow({event}:{event:DriverEvent}){
  return <article className="driver-event-row">
    {event.creative_url?<img className="driver-event-row__creative" src={event.creative_url} alt={`${event.advertisement_title} creative`}/>:<div className="driver-event-row__creative driver-event-row__placeholder" aria-label="No creative preview">Ad</div>}
    <div className="driver-event-row__content"><strong>{event.advertisement_title}{event.is_demo&&<span className="demo-badge">DEMO</span>}</strong><span>{event.advertiser_name} · {event.campaign_name}</span><span>{event.vehicle_summary?`${event.vehicle_summary.vehicle_model} · ${event.vehicle_summary.registration_number}`:"Vehicle unavailable"}</span></div>
    <dl className="driver-event-row__facts"><div><dt>Date</dt><dd>{date(event.started_at)}</dd></div><div><dt>Broadcast time</dt><dd>{clock(event.started_at)} – {clock(event.ended_at)}</dd></div><div><dt>Duration</dt><dd>{duration(event.duration_seconds)}</dd></div><div><dt>Plays</dt><dd>{event.plays==null?"Not reported":event.plays.toLocaleString()}</dd></div><div><dt>Impressions</dt><dd>{event.impressions==null?"Not reported":event.impressions.toLocaleString()} <small>{event.measurement_status}</small></dd></div></dl>
  </article>;
}
