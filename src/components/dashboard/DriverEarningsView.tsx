"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getDriverEarnings, type DriverEarningsResponse } from "@/lib/api/drivers";

const money=(value:number|string|null|undefined)=>value==null?"$0.00":Number(value).toLocaleString("en-US",{style:"currency",currency:"USD"});
const clock=(value:string|null)=>value?new Intl.DateTimeFormat(undefined,{hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(new Date(value)):"In progress";
const duration=(seconds:number)=>{const minutes=Math.floor(seconds/60);const rest=seconds%60;return `${minutes}m ${rest}s`;};
const date=(value:string)=>new Intl.DateTimeFormat(undefined,{dateStyle:"medium"}).format(new Date(value));

export default function DriverEarningsView(){
  const [data,setData]=useState<DriverEarningsResponse|null>(null);
  const [dateFrom,setDateFrom]=useState("");const [dateTo,setDateTo]=useState("");const [status,setStatus]=useState("");
  const [loading,setLoading]=useState(true);const [error,setError]=useState("");const [page,setPage]=useState(1);
  const load=useCallback(()=>{setLoading(true);setError("");getDriverEarnings({dateFrom,dateTo,status,page}).then(setData).catch(e=>setError(e instanceof ApiError?e.message:"Earnings could not be loaded. Please try again.")).finally(()=>setLoading(false));},[dateFrom,dateTo,status,page]);
  useEffect(()=>{void load();},[load]);
  const summary=data?.summary;
  const metrics=[["Total earnings",summary?.total_earnings],["Earnings today",summary?.today],["Earnings this week",summary?.this_week],["Earnings this month",summary?.this_month],["Pending earnings",summary?.pending_earnings],["Paid earnings",summary?.paid_earnings]] as const;
  return <div className="dview driver-earnings">
    <section className="dview__hello"><div><h1>Earnings</h1><p>Track advertising income calculated from recorded broadcast time and campaign rates.</p></div></section>
    {error&&<div className="api-error" role="alert">{error} <button type="button" onClick={()=>void load()}>Try again</button></div>}
    {summary&&<section className="dview__metrics driver-earnings__metrics" aria-label="Earnings summary">{metrics.map(([label,value])=><article className="metric" key={label}><p className="metric__label">{label}</p><p className="metric__value metric__value--small">{money(value)}</p></article>)}</section>}
    <section className="dcard dcard--wide"><header className="dcard__head"><div><h2>Earnings history</h2><p>Each row corresponds to one broadcast interval; demo records are labeled.</p></div></header>
      <form className="earnings-filters" onSubmit={e=>{e.preventDefault();setPage(1);void load();}}>
        <label>From<input type="date" value={dateFrom} onChange={e=>{setPage(1);setDateFrom(e.target.value);}}/></label>
        <label>To<input type="date" value={dateTo} onChange={e=>{setPage(1);setDateTo(e.target.value);}}/></label>
        <label>Payment status<select value={status} onChange={e=>{setPage(1);setStatus(e.target.value);}}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="PAID">Paid</option></select></label>
        <button className="btn btn--navy btn--sm" type="submit">Apply filters</button>
        <button className="earnings-filters__reset" type="button" onClick={()=>{setDateFrom("");setDateTo("");setStatus("");setPage(1);}}>Clear</button>
      </form>
      {loading?<p className="api-state" role="status">Loading earnings history…</p>:!data?.results.length?<p className="api-empty">No advertising earnings match this range.</p>:<div className="dtable__wrap"><table className="dtable driver-earnings__table"><thead><tr><th>Date</th><th>Advertisement</th><th>Broadcasting time</th><th>Duration</th><th>Impressions</th><th>Earnings</th><th>Status</th></tr></thead><tbody>{data.results.map(event=><tr key={event.id}><td>{date(event.started_at)}</td><th scope="row">{event.advertisement_title}{event.is_demo&&<span className="demo-badge">DEMO</span>}<small className="earnings-advertiser">{event.advertiser_name}</small></th><td>{clock(event.started_at)} – {clock(event.ended_at)}</td><td>{duration(event.duration_seconds)}</td><td>{event.impressions==null?"Not reported":event.impressions.toLocaleString()}<small className="earnings-advertiser">{event.measurement_status}</small></td><td>{money(event.earnings)}</td><td><span className={`pill ${event.earning_status==="PAID"?"pill--live":"pill--draft"}`}>{event.earning_status.toLowerCase()}</span></td></tr>)}</tbody></table></div>}
      {data&&data.count>data.page_size&&<div className="earnings-pagination"><span>{data.count} matching broadcasts</span><button type="button" disabled={page<=1||loading} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {data.page}</span><button type="button" disabled={page*data.page_size>=data.count||loading} onClick={()=>setPage(p=>p+1)}>Next</button></div>}
    </section>
    <p className="measurement-note">Demo earnings and impression values are for product walkthroughs only. Earnings use the campaign’s recorded hourly compensation rate; impressions are labeled by their measurement source.</p>
  </div>;
}
