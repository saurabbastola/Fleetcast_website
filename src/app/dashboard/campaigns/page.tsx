"use client";
import DashboardCollection from "@/components/dashboard/DashboardCollection";
import { useAuth } from "@/lib/auth";

export default function CampaignsPage(){
  const {account}=useAuth();
  if(account?.role==="DRIVER")return <p className="api-state" role="status">Taking you to your dashboard…</p>;
  return <DashboardCollection kind="campaigns"/>;
}
