import { api } from "@/lib/api/client";

export type DriverEvent = {
  id:number;advertisement:number|null;advertisement_title:string;creative_url:string|null;advertiser_name:string;campaign_name:string;
  driver:string;campaign_status:string;date:string;started_at:string;ended_at:string|null;duration_seconds:number;plays:number|null;impressions:number|null;
  measurement_status:string;earnings:string|number;earning_status:"PENDING"|"PAID";is_demo:boolean;
  vehicle_summary:{id:number;registration_number:string;vehicle_model:string}|null;
};

export type DriverEarningsSummary={total_earnings:string;today:string;this_week:string;this_month:string;pending_earnings:string;paid_earnings:string};
export type DriverEarningsResponse={summary:DriverEarningsSummary;count:number;page:number;page_size:number;results:DriverEvent[]};

export function getDriverEarnings(filters:{dateFrom?:string;dateTo?:string;status?:string;page?:number}={}){
  const params=new URLSearchParams();
  if(filters.dateFrom)params.set("date_from",filters.dateFrom);
  if(filters.dateTo)params.set("date_to",filters.dateTo);
  if(filters.status)params.set("status",filters.status);
  if(filters.page)params.set("page",String(filters.page));
  const query=params.toString();
  return api<DriverEarningsResponse>(`/driver/earnings/${query?`?${query}`:""}`);
}
