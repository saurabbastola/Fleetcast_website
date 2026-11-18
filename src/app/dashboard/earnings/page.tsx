"use client";
import { useAuth } from "@/lib/auth";
import DashboardCollection from "@/components/dashboard/DashboardCollection";
import DriverEarningsView from "@/components/dashboard/DriverEarningsView";
export default function EarningsPage(){const {account}=useAuth();return account?.role==="DRIVER"?<DriverEarningsView/>:<DashboardCollection kind="earnings"/>;}
