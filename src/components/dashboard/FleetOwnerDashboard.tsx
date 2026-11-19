"use client";

import Link from "next/link";
import { firstName } from "@/lib/machines/session";
import type { Account } from "@/lib/machines/session";

type Creative = {campaign_id:number;campaign_name:string;campaign_status:string;advertiser_name:string;advertisement_title:string;advertisement_image_url:string|null;is_demo:boolean;started_at:string|null};
type FleetVehicle = {id:number;registration_number:string;vehicle_model:string;vehicle_type:string;status:string;is_demo:boolean;is_broadcasting:boolean;advertising_status:string;current_advertisement:Creative|null;active_campaigns:number;broadcast_hours:number;impressions:number|null;earnings:number|null};
type Activity = {session_id:number;campaign_name:string;advertiser_name:string;advertisement_title:string;advertisement_image_url:string|null;is_demo:boolean;started_at:string;ended_at:string|null;hours:number;impressions:number|null;measurement_status:string;vehicle:{id:number;registration_number:string;vehicle_model:string}|null};
export type FleetSummary = {vehicles:number;pending_vehicles:number;approved_vehicles:number;campaigns:number;active_advertising_vehicles:number;broadcast_hours:number|null;impressions:number|null;earnings:number|null;measurement_status:string;fleet_vehicles:FleetVehicle[];recent_activity:Activity[]};

const amount=(value:number|null|undefined)=>value==null?"Not available":value.toLocaleString();
const money=(value:number|null|undefined)=>value==null?"Not available":value.toLocaleString("en-US",{style:"currency",currency:"USD"});
const time=(value:string)=>new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));
const pretty=(value:string)=>value==="APPROVED"?"Verified":value==="PENDING"?"Pending review":value.replaceAll("_"," ").toLowerCase().replace(/\b\w/g,x=>x.toUpperCase());

export default function FleetOwnerDashboard({account,summary,loading,error,onRetry}:{account:Account;summary:FleetSummary|null;loading:boolean;error:string;onRetry:()=>void}) {
  if(loading)return <p className="api-state" role="status">Loading your fleet overview…</p>;
  if(error)return <div className="api-error" role="alert">{error}<button type="button" onClick={onRetry}>Try again</button></div>;
  const fleet=summary?.fleet_vehicles||[];
  return <div className="dview">
    <section className="dview__hello"><div><h1>Fleet overview</h1><p>Welcome back, {firstName(account)}. Review vehicle verification and advertising activity across your fleet.</p></div><Link className="btn btn--orange btn--sm" href="/dashboard/vehicles/new">+ Register vehicle</Link></section>
    <section className="dview__metrics" aria-label="Fleet summary">
      <article className="metric"><p className="metric__label">Registered vehicles</p><p className="metric__value metric__value--small">{amount(summary?.vehicles)}</p></article>
      <article className="metric"><p className="metric__label">Verified vehicles</p><p className="metric__value metric__value--small">{amount(summary?.approved_vehicles)}</p></article>
      <article className="metric"><p className="metric__label">Pending review</p><p className="metric__value metric__value--small">{amount(summary?.pending_vehicles)}</p></article>
      <article className="metric"><p className="metric__label">Advertising now</p><p className="metric__value metric__value--small">{amount(summary?.active_advertising_vehicles)}</p></article>
      <article className="metric"><p className="metric__label">Running campaigns</p><p className="metric__value metric__value--small">{amount(summary?.campaigns)}</p></article>
      <article className="metric"><p className="metric__label">Broadcast hours</p><p className="metric__value metric__value--small">{summary?.broadcast_hours==null?"Not available":summary.broadcast_hours.toFixed(2)}</p></article>
      <article className="metric"><p className="metric__label">Impressions (reported)</p><p className="metric__value metric__value--small">{amount(summary?.impressions)}</p></article>
      <article className="metric"><p className="metric__label">Estimated fleet earnings</p><p className="metric__value metric__value--small">{money(summary?.earnings)}</p></article>
    </section>
    {summary?.measurement_status&&summary.measurement_status!=="UNAVAILABLE"&&<p className="measurement-note">{summary.measurement_status==="DEMO"?"DEMO SAMPLE DATA":summary.measurement_status==="VERIFIED"?"VERIFIED RECORDS":"ESTIMATED · Driver timer sessions"} · Impressions are not verified by vehicle hardware or GPS.</p>}

    <section className="dcard dcard--wide" aria-labelledby="fleet-vehicles-title"><header className="dcard__head"><div><h2 id="fleet-vehicles-title">Vehicle overview</h2><p>See each vehicle’s verification and advertising status.</p></div><Link className="dcard__action" href="/dashboard/vehicles">Manage vehicles →</Link></header>
      {fleet.length===0?<div className="api-empty"><p>No vehicles are registered to this Fleet Owner account.</p><Link href="/dashboard/vehicles/new">Register a vehicle</Link></div>:<div className="dtable__wrap"><table className="dtable fleet-vehicle-table"><thead><tr><th>Vehicle</th><th>Verification</th><th>Advertising status</th><th>Current creative</th><th>Campaigns</th><th>Hours</th><th>Impressions</th><th>Earnings</th><th></th></tr></thead><tbody>{fleet.map(vehicle=><tr key={vehicle.id}><th scope="row">{vehicle.vehicle_model}<br/><small>{vehicle.registration_number} · {vehicle.vehicle_type}</small>{vehicle.is_demo&&<span className="demo-badge">DEMO</span>}</th><td>{pretty(vehicle.status)}</td><td>{pretty(vehicle.advertising_status)}</td><td>{vehicle.current_advertisement?<span className="fleet-creative">{vehicle.current_advertisement.advertisement_image_url&&<img src={vehicle.current_advertisement.advertisement_image_url} alt=""/>}<span>{vehicle.current_advertisement.campaign_name}<small>{vehicle.current_advertisement.advertiser_name}</small></span></span>:"No ad assigned"}</td><td>{vehicle.active_campaigns}</td><td>{vehicle.broadcast_hours.toFixed(2)}</td><td>{amount(vehicle.impressions)}</td><td>{money(vehicle.earnings)}</td><td><Link href={`/dashboard/vehicles/${vehicle.id}`}>Ad history</Link></td></tr>)}</tbody></table></div>}
    </section>

    <section className="dcard dcard--wide" aria-labelledby="recent-fleet-activity-title"><header className="dcard__head"><div><h2 id="recent-fleet-activity-title">Recent fleet activity</h2><p>Latest recorded broadcast sessions across your vehicles.</p></div><Link className="dcard__action" href="/dashboard/campaigns">Driver Activity →</Link></header>
      {!summary?.recent_activity.length?<p className="api-empty">No broadcast sessions have been recorded yet.</p>:<div className="fleet-activity-list">{summary.recent_activity.map(item=><article key={item.session_id} className="fleet-activity-row">{item.advertisement_image_url?<img src={item.advertisement_image_url} alt=""/>:<div className="fleet-activity-placeholder" aria-hidden="true">Ad</div>}<div className="fleet-activity-row__main"><strong>{item.advertisement_title}</strong><span>{item.advertiser_name} · {item.campaign_name}{item.is_demo&&<span className="demo-badge">DEMO</span>}</span><span>{item.vehicle?`${item.vehicle.vehicle_model} · ${item.vehicle.registration_number}`:"Vehicle not assigned"}</span></div><div className="fleet-activity-row__stats"><strong>{item.ended_at?`${item.hours.toFixed(2)} hours`:"Broadcast in progress"}</strong><span>{time(item.started_at)} · {item.impressions==null?"Impressions not recorded":`${item.impressions.toLocaleString()} impressions`}</span><span>{pretty(item.measurement_status)}</span></div></article>)}</div>}
    </section>
  </div>;
}
