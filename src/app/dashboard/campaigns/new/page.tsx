"use client";
import DashboardCollection from "@/components/dashboard/DashboardCollection";
import { useAuth } from "@/lib/auth";
export default function NewCampaignPage(){const {account}=useAuth();return account?.role==="BUSINESS"?<DashboardCollection kind="campaigns"/>:<p className="api-state" role="status">Taking you to your dashboard…</p>;}
