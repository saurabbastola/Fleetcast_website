"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { businessApi, driverApi } from "@/lib/api/resources";
import { ApiError } from "@/lib/api/client";

export default function ProfileView(){
 const {account}=useAuth();const [profile,setProfile]=useState<any>(null);const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [error,setError]=useState("");const [notice,setNotice]=useState("");
 useEffect(()=>{if(!account)return;const fn=account.role==="DRIVER"?driverApi.profile:businessApi.profile;fn().then(setProfile).catch((e)=>setError(e instanceof ApiError?e.message:"Profile could not be loaded.")).finally(()=>setLoading(false));},[account]);
 const save=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();if(!account)return;setSaving(true);setError("");setNotice("");const data=new FormData(e.currentTarget);const body=new FormData();
  for(const key of account.role==="DRIVER"?["address","license_number","profile_photo"]:["company_name","business_address","website","description","company_logo"]){const val=data.get(key);if(val instanceof File){if(val.size)body.append(key,val);}else if(val)body.append(key,val);}
  try{const result=account.role==="DRIVER"?await driverApi.update(body):await businessApi.update(body);setProfile(result);setNotice("Profile saved.");}catch(err){setError(err instanceof ApiError?err.message:"Profile could not be saved.");}finally{setSaving(false);}
 };
 if(loading)return <p className="api-state" role="status">Loading profile…</p>;
 if(!account)return null;
 return <div className="dview"><section className="dview__hello"><div><h1>{account.role==="DRIVER"?"Driver profile":"Business profile"}</h1><p>Update your account and organization details.</p></div><span className="pill pill--scheduled">Verification: {profile?.verification_status||"Pending"}</span></section>
  <section className="dcard dcard--wide"><form className="dform" onSubmit={save}>
   {account.role==="DRIVER"?<><label className="field"><span>Address</span><textarea name="address" defaultValue={profile?.address||""}/></label><label className="field"><span>License number</span><input name="license_number" defaultValue={profile?.license_number||""}/></label><label className="field"><span>Profile photo (JPG, PNG or WebP; max 10 MB)</span><input name="profile_photo" type="file" accept="image/jpeg,image/png,image/webp"/></label>{profile?.profile_photo_url&&<a href={profile.profile_photo_url} target="_blank" rel="noreferrer">View current photo</a>}</>:<><label className="field"><span>Company name</span><input name="company_name" required defaultValue={profile?.company_name||""}/></label><label className="field"><span>Business address</span><textarea name="business_address" defaultValue={profile?.business_address||""}/></label><label className="field"><span>Website</span><input name="website" type="url" defaultValue={profile?.website||""}/></label><label className="field"><span>Description</span><textarea name="description" defaultValue={profile?.description||""}/></label><label className="field"><span>Company logo (JPG, PNG or WebP; max 10 MB)</span><input name="company_logo" type="file" accept="image/jpeg,image/png,image/webp"/></label>{profile?.company_logo_url&&<a href={profile.company_logo_url} target="_blank" rel="noreferrer">View current logo</a>}</>}
   {error&&<p className="form__error" role="alert">{error}</p>}{notice&&<p className="dform__ok" role="status">{notice}</p>}<div className="dform__actions"><button className="btn btn--navy btn--sm" disabled={saving}>{saving?"Saving…":"Save profile"}</button></div>
  </form></section></div>;
}
