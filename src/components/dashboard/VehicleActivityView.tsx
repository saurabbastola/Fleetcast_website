"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api/client";
import { rows } from "@/lib/api/resources";

type Vehicle={id:number;registration_number:string;vehicle_model:string;vehicle_type:string;status:string;is_demo:boolean};
type Session={id:number;started_at:string;ended_at:string|null;hours:number;impressions:number|null;measurement_status:string;campaign_id:number;campaign_name:string;campaign_status:string;is_demo:boolean;advertiser_name:string;advertisement_title:string;advertisement_image_url:string|null};
type ActivityResponse={vehicle:Vehicle;current_advertisement:any;activity:Session[]};
const when=(value:string)=>new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));
const label=(value:string)=>value==="APPROVED"?"Verified":value==="PENDING"?"Pending review":value.replaceAll("_"," ").toLowerCase().replace(/\b\w/g,x=>x.toUpperCase());

export default function VehicleActivityView(){
  const params=useParams<{id:string}>();const id=String(params.id);const router=useRouter();
  const [data,setData]=useState<ActivityResponse|null>(null);const [vehicles,setVehicles]=useState<Vehicle[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
  useEffect(()=>{let active=true;setLoading(true);setError("");Promise.all([api<ActivityResponse>(`/vehicles/${id}/activity/`),api<any>("/vehicles/")]).then(([activity,registered])=>{if(active){setData(activity);setVehicles(rows(registered));}}).catch(e=>{if(active)setError(e instanceof ApiError?e.message:"Vehicle advertising history could not be loaded.");}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[id]);
  if(loading)return <p className="api-state" role="status">Loading vehicle advertising history…</p>;
  if(error)return <div className="api-error" role="alert">{error}<button type="button" onClick={()=>router.refresh()}>Try again</button></div>;
  if(!data)return null;
  const current=data.current_advertisement;
  return <div className="dview">
    <section className="dview__hello"><div><p className="dform__hint"><Link href="/dashboard">← Fleet overview</Link></p><h1>{data.vehicle.vehicle_model}</h1><p>{data.vehicle.registration_number} · {data.vehicle.vehicle_type} · {label(data.vehicle.status)}{data.vehicle.is_demo&&" · DEMO VEHICLE"}</p></div><Link className="btn btn--navy btn--sm" href="/dashboard/campaigns">Driver Activity</Link></section>
    {vehicles.length>1&&<label className="collection-search"><span>Select vehicle</span><select aria-label="Select registered vehicle" value={id} onChange={e=>router.push(`/dashboard/vehicles/${e.target.value}`)}>{vehicles.map(vehicle=><option key={vehicle.id} value={vehicle.id}>{vehicle.vehicle_model} · {vehicle.registration_number}</option>)}</select></label>}
    <section className="dcard dcard--wide" aria-labelledby="vehicle-current-title"><header className="dcard__head"><div><h2 id="vehicle-current-title">Current advertisement</h2><p>The campaign creative assigned to this vehicle.</p></div><span className={`pill ${current?.open_session?"pill--live":current?"pill--draft":""}`}>{current?.open_session?"Broadcast active":current?"Selected · not broadcasting":"No ad selected"}</span></header>
      {!current?<p className="api-empty">No campaign advertisement is selected for this vehicle.</p>:<div className="vehicle-current-ad">{current.campaign.advertisement_image_url&&<img src={current.campaign.advertisement_image_url} alt={`${current.campaign.advertisement_title||current.campaign.name} creative`}/>}<div><h3>{current.campaign.advertisement_title||current.campaign.name}</h3><p>{current.campaign.advertiser_name} · {current.campaign.name}</p><p>Campaign status: {label(current.campaign.status)}{current.campaign.is_demo&&<span className="demo-badge">DEMO</span>}</p>{current.open_session&&<p className="driver-live">Since {when(current.open_session.started_at)} · {current.open_session.hours.toFixed(2)} hours</p>}</div></div>}
    </section>
    <section className="dcard dcard--wide" aria-labelledby="vehicle-history-title"><header className="dcard__head"><div><h2 id="vehicle-history-title">Advertisement history</h2><p>Past and current broadcast sessions recorded for this vehicle.</p></div><span className="dcard__action">{data.activity.length} sessions</span></header>
      {!data.activity.length?<p className="api-empty">No broadcast history is recorded for this vehicle yet. Assign a demo campaign and start a session from Driver Activity to see it here.</p>:<div className="vehicle-history-list">{data.activity.map(session=><article className="vehicle-history-card" key={session.id}>{session.advertisement_image_url?<img className="vehicle-history-card__creative" src={session.advertisement_image_url} alt={`${session.advertisement_title} creative preview`}/>:<div className="vehicle-history-card__placeholder" aria-label="Creative preview unavailable">Creative preview unavailable</div>}<div className="vehicle-history-card__content"><div className="vehicle-history-card__heading"><div><h3>{session.advertisement_title}</h3><p>{session.advertiser_name} · {session.campaign_name}{session.is_demo&&<span className="demo-badge">DEMO</span>}</p></div><span className="pill pill--scheduled">{label(session.campaign_status)}</span></div><dl className="vehicle-history-card__facts"><div><dt>Broadcast time</dt><dd>{when(session.started_at)}{session.ended_at?` – ${when(session.ended_at)}`:" · In progress"}</dd></div><div><dt>Duration</dt><dd>{session.ended_at?`${session.hours.toFixed(2)} hours`:"In progress"}</dd></div><div><dt>Reported impressions</dt><dd>{session.impressions==null?"Not recorded":session.impressions.toLocaleString()}</dd></div><div><dt>Measurement</dt><dd>{label(session.measurement_status)}</dd></div></dl></div></article>)}</div>}
      <p className="measurement-note">Session times come from the driver timer. Impression values appear only when stored for a session; they are not confirmed by vehicle hardware or GPS.</p>
    </section>
  </div>;
}
