"use client";
import DashboardCollection from "@/components/dashboard/DashboardCollection";
import DriverCampaignDashboard from "@/components/dashboard/DriverCampaignDashboard";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api/client";
import { useEffect, useState } from "react";

export default function CampaignsPage(){
  const {account}=useAuth(); const [summary,setSummary]=useState<any>(null); const [error,setError]=useState("");
  useEffect(()=>{if(account?.role!=="DRIVER")return;api("/driver/dashboard/").then(setSummary).catch(e=>setError(e instanceof ApiError?e.message:"We couldn't load your activity."));},[account]);
  if(account?.role!=="DRIVER")return <DashboardCollection kind="campaigns"/>;
  if(error)return <div className="api-error" role="alert">{error}</div>;
  if(!summary)return <p className="api-state" role="status">Loading driver campaigns…</p>;
  return <DriverCampaignDashboard summary={summary}/>;
}
