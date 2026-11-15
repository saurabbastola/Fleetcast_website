"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api/client";
import { rows } from "@/lib/api/resources";

export type CollectionKind = "campaigns"|"advertisements"|"vehicles"|"payments"|"notifications"|"admin-users"|"admin-businesses"|"admin-drivers"|"admin-vehicles"|"admin-advertisements"|"admin-campaigns"|"earnings";
const CONFIG: Record<CollectionKind,{title:string;endpoint:string;columns:string[];create?:boolean;search?:boolean;empty:string}> = {
  campaigns:{title:"Campaigns",endpoint:"/campaigns/",columns:["name","budget","start_date","end_date","status"],create:true,search:true,empty:"No campaigns yet."},
  advertisements:{title:"Advertisements",endpoint:"/advertisements/",columns:["title","description","status"],create:true,search:true,empty:"No advertisements yet."},
  vehicles:{title:"Vehicles",endpoint:"/vehicles/",columns:["registration_number","vehicle_model","vehicle_type","status"],create:true,search:true,empty:"No vehicles registered yet."},
  payments:{title:"Payment history",endpoint:"/payments/",columns:["amount","currency","payment_status","transaction_reference","created_at"],search:true,empty:"No payment records are available."},
  notifications:{title:"Notifications",endpoint:"/notifications/",columns:["title","message","is_read","created_at"],search:true,empty:"No notifications."},
  "admin-users":{title:"Users",endpoint:"/admin/users/",columns:["email","name","role","is_active","created_at"],search:true,empty:"No users found."},
  "admin-businesses":{title:"Businesses",endpoint:"/admin/businesses/",columns:["email","company_name","verification_status","created_at"],search:true,empty:"No businesses found."},
  "admin-drivers":{title:"Drivers",endpoint:"/admin/drivers/",columns:["email","name","verification_status","created_at"],search:true,empty:"No drivers found."},
  "admin-vehicles":{title:"Vehicle approvals",endpoint:"/admin/vehicles/",columns:["registration_number","vehicle_model","vehicle_type","status","created_at"],search:true,empty:"No vehicles found."},
  "admin-advertisements":{title:"Advertisement approvals",endpoint:"/admin/advertisements/",columns:["title","description","status","created_at"],search:true,empty:"No advertisements found."},
  "admin-campaigns":{title:"Campaign management",endpoint:"/admin/campaigns/",columns:["name","budget","start_date","end_date","status"],search:true,empty:"No campaigns found."},
  earnings:{title:"Earnings",endpoint:"",columns:[],empty:"Earnings are not implemented yet. No estimates are shown."},
};

const label = (key:string) => key.replaceAll("_"," ").replace(/\b\w/g,(x)=>x.toUpperCase());
const readable = (value:any) => value == null || value === "" ? "—" : typeof value === "boolean" ? value ? "Yes" : "No" : String(value).replaceAll("_"," ");

export default function DashboardCollection({kind}:{kind:CollectionKind}) {
  const config = CONFIG[kind]; const isAdmin = kind.startsWith("admin-"); const hasActions = (config.create && kind !== "payments" && kind !== "notifications") || isAdmin || kind === "notifications";
  const [data,setData]=useState<any[]>([]); const [pageInfo,setPageInfo]=useState<{count:number;next:any;previous:any}>({count:0,next:null,previous:null}); const [page,setPage]=useState(1); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [search,setSearch]=useState(""); const [formOpen,setFormOpen]=useState(()=>typeof window!=="undefined"&&window.location.pathname.endsWith("/new")); const [edit,setEdit]=useState<any>(null); const [saving,setSaving]=useState(false); const [message,setMessage]=useState("");
  const [fields,setFields]=useState<Record<string,string>>({});
  const load=useCallback(async()=>{ if(!config.endpoint){setLoading(false);return;} setLoading(true);setError("");
    try { const params=new URLSearchParams({page:String(page)});if(search)params.set("search",search);const result=await api<any>(`${config.endpoint}?${params}`);setData(rows(result));setPageInfo({count:Number(result.count||0),next:result.next,previous:result.previous}); }
    catch(e){setError(e instanceof ApiError?e.message:"We couldn't load these records. Try again.");} finally{setLoading(false);} },[config.endpoint,search,page]);
  useEffect(()=>{void load();},[load]);
  const startEdit=(item:any)=>{setEdit(item);setFields({name:item.name||"",title:item.title||"",description:item.description||"",budget:item.budget||"",start_date:item.start_date||"",end_date:item.end_date||"",registration_number:item.registration_number||"",vehicle_model:item.vehicle_model||"",vehicle_type:item.vehicle_type||""});setFormOpen(true);setError("");};
  const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();setSaving(true);setError("");setMessage("");const form=new FormData(e.currentTarget);
    try {
      if(kind==="campaigns") { const body={name:form.get("name"),description:form.get("description"),budget:form.get("budget"),start_date:form.get("start_date")||null,end_date:form.get("end_date")||null}; await api(edit?`${config.endpoint}${edit.id}/`:config.endpoint,{method:edit?"PATCH":"POST",body:JSON.stringify(body)}); }
      if(kind==="advertisements") { const body=new FormData(); for(const k of ["title","description","image"]) {const v=form.get(k);if(v)body.append(k,v);} await api(edit?`${config.endpoint}${edit.id}/`:config.endpoint,{method:edit?"PATCH":"POST",body}); }
      if(kind==="vehicles") { const body=new FormData();for(const k of ["registration_number","vehicle_model","vehicle_type","registration_document"]){const v=form.get(k);if(v)body.append(k,v);}await api(edit?`${config.endpoint}${edit.id}/`:config.endpoint,{method:edit?"PATCH":"POST",body}); }
      setFormOpen(false);setEdit(null);setMessage(edit?"Changes saved.":"Record created.");void load();
    } catch(e){setError(e instanceof ApiError?e.message:"We couldn't save this record.");} finally{setSaving(false);}
  };
  const remove=async(item:any)=>{if(!window.confirm(`Delete ${item.name||item.title||item.registration_number||"this record"}?`))return;try{await api(`${config.endpoint}${item.id}/`,{method:"DELETE"});void load();}catch(e){setError(e instanceof ApiError?e.message:"This record couldn't be deleted.");}};
  const review=async(item:any,value:string)=>{const labelValue=item.name||item.title||item.registration_number||"this record";if(!window.confirm(`${value.replaceAll("_"," ")} ${labelValue}?`))return;
    try {
      if(kind==="admin-businesses"||kind==="admin-drivers") await api(config.endpoint,{method:"PATCH",body:JSON.stringify({id:item.id,verification_status:value})});
      else if(kind==="notifications") await api(`${config.endpoint}${item.id}/`,{method:"PATCH",body:JSON.stringify({is_read:true})});
      else if(kind==="admin-vehicles") await api(`${config.endpoint}${item.id}/review/`,{method:"POST",body:JSON.stringify({status:value})});
      else if(kind==="admin-advertisements") await api(`${config.endpoint}${item.id}/review/`,{method:"POST",body:JSON.stringify({status:value})});
      else await api(`${config.endpoint}${item.id}/status/`,{method:"POST",body:JSON.stringify({status:value})});
      void load();
    }catch(e){setError(e instanceof ApiError?e.message:"The review action could not be saved.");}
  };
  const title=edit?`Edit ${config.title.toLowerCase().replace(/s$/,'')}`:`Create ${config.title.toLowerCase().replace(/s$/,'')}`;
  return <div className="dview">
    <section className="dview__hello"><div><h1>{config.title}</h1><p>{isAdmin?"Review and manage platform records.":"Manage your Fleetcast account records."}</p></div>{config.create&&<button className="btn btn--orange btn--sm" type="button" onClick={()=>{setEdit(null);setFields({});setFormOpen(!formOpen);setError("");}}>{formOpen?"Close":"+ Add new"}</button>}</section>
    {message&&<p className="dform__ok" role="status">{message}</p>}{error&&<div className="api-error" role="alert">{error}<button type="button" onClick={()=>void load()}>Try again</button></div>}
    {config.create&&formOpen&&<section className="dcard dcard--wide" aria-label={title}><header className="dcard__head"><h2>{title}</h2></header><form className="dform" onSubmit={submit}>
      {kind==="campaigns"&&<><label className="field"><span>Campaign name</span><input name="name" required defaultValue={edit?.name||""}/></label><label className="field"><span>Description</span><textarea name="description" defaultValue={edit?.description||""}/></label><label className="field"><span>Budget</span><input name="budget" type="number" min="0" step="0.01" required defaultValue={edit?.budget||"0"}/></label><label className="field"><span>Start date</span><input name="start_date" type="date" defaultValue={edit?.start_date||""}/></label><label className="field"><span>End date</span><input name="end_date" type="date" defaultValue={edit?.end_date||""}/></label></>}
      {kind==="advertisements"&&<><label className="field"><span>Advertisement title</span><input name="title" required defaultValue={edit?.title||""}/></label><label className="field"><span>Description</span><textarea name="description" defaultValue={edit?.description||""}/></label><label className="field"><span>Creative image (JPG, PNG or WebP; max 10 MB)</span><input name="image" type="file" accept="image/jpeg,image/png,image/webp" required={!edit}/></label></>}
      {kind==="vehicles"&&<><label className="field"><span>Registration number</span><input name="registration_number" required defaultValue={edit?.registration_number||""}/></label><label className="field"><span>Vehicle model</span><input name="vehicle_model" required defaultValue={edit?.vehicle_model||""}/></label><label className="field"><span>Vehicle type</span><select name="vehicle_type" required defaultValue={edit?.vehicle_type||""}><option value="">Choose a type</option><option>Car</option><option>Taxi</option><option>Bus</option><option>Truck</option><option>Train</option><option>Other</option></select></label><label className="field"><span>Registration document (PDF or image; max 10 MB)</span><input name="registration_document" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required={!edit}/></label></>}
      <div className="dform__actions"><button className="btn btn--navy btn--sm" disabled={saving}>{saving?"Saving…":edit?"Save changes":"Create"}</button></div>
    </form></section>}
    {config.search&&<label className="collection-search"><span>Search</span><input value={search} onChange={(e)=>{setSearch(e.target.value);setPage(1);}} placeholder={`Search ${config.title.toLowerCase()}`} /></label>}
    <section className="dcard dcard--wide"><div className="dtable__wrap"><table className="dtable"><thead><tr>{config.columns.map((col)=><th key={col}>{label(col)}</th>)}{(config.create||isAdmin||kind==="notifications")&&<th scope="col">Actions</th>}</tr></thead><tbody>
      {loading?<tr><td colSpan={config.columns.length+(hasActions?1:0)}>Loading…</td></tr>:data.length===0?<tr><td colSpan={config.columns.length+(hasActions?1:0)}>{config.empty}</td></tr>:data.map((item)=><tr key={item.id}>{config.columns.map((col)=><td key={col}>{readable(item[col])}</td>)}{hasActions&&<td className="collection-actions">
        {config.create&&kind!=="payments"&&kind!=="notifications"&&<><button type="button" onClick={()=>startEdit(item)}>Edit</button><button type="button" onClick={()=>void remove(item)}>Delete</button></>}
        {isAdmin&&kind==="admin-businesses"&&<><button type="button" onClick={()=>void review(item,"APPROVED")}>Approve</button><button type="button" onClick={()=>void review(item,"REJECTED")}>Reject</button></>}
        {isAdmin&&kind==="admin-drivers"&&<><button type="button" onClick={()=>void review(item,"APPROVED")}>Approve</button><button type="button" onClick={()=>void review(item,"REJECTED")}>Reject</button></>}
        {isAdmin&&kind==="admin-vehicles"&&<><button type="button" onClick={()=>void review(item,"APPROVED")}>Approve</button><button type="button" onClick={()=>void review(item,"REJECTED")}>Reject</button></>}
        {isAdmin&&kind==="admin-advertisements"&&<><button type="button" onClick={()=>void review(item,"APPROVED")}>Approve</button><button type="button" onClick={()=>void review(item,"REJECTED")}>Reject</button></>}
        {isAdmin&&kind==="admin-campaigns"&&<><button type="button" onClick={()=>void review(item,"ACTIVE")}>Set active</button><button type="button" onClick={()=>void review(item,"PAUSED")}>Pause</button></>}
        {kind==="notifications"&&!item.is_read&&<button type="button" onClick={()=>void review(item,"read")}>Mark read</button>}
      </td>}</tr>)}</tbody></table></div>{pageInfo.count>25&&<div className="collection-pagination"><span>{pageInfo.count} records · Page {page}</span><button type="button" disabled={page<=1||loading} onClick={()=>setPage((v)=>Math.max(1,v-1))}>Previous</button><button type="button" disabled={!pageInfo.next||loading} onClick={()=>setPage((v)=>v+1)}>Next</button></div>}</section>
    <p className="dform__hint"><Link href={isAdmin ? "/dashboard/admin" : "/dashboard"}>← Back to overview</Link></p>
  </div>;
}
