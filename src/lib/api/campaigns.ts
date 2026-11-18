import { api } from "./client";
export type Campaign = {
  id: number | string; business?: string; advertiser_name?: string; advertisement?: number | string | null;
  advertisement_title?: string; advertisement_image_url?: string | null; name: string; description: string;
  industry?: string; advertisement_type?: string; budget: string; start_date: string | null; end_date: string | null;
  available_driver_slots?: number; available_slots?: number | null; service_areas?: string[];
  expected_broadcast_hours?: string; estimated_impressions?: number | null; compensation_rate?: string;
  requirements?: string; eligibility_criteria?: string; advertisement_duration_seconds?: number | null;
  status: string; is_demo?: boolean; participation_count?: number; broadcast_hours?: number | null;
  broadcast_impressions?: number | null; measurement_status?: "DEMO" | "ESTIMATED" | "VERIFIED" | "UNAVAILABLE";
  created_at: string; updated_at?: string;
};
export type CampaignParticipation = {
  id: number; campaign: Campaign; driver_id?: string; driver_name?: string; driver_email?: string;
  status: string; is_current: boolean; applied_at: string; updated_at: string; hours: number;
  impressions: number | null; estimated_earnings: string; measurement_status: "DEMO" | "ESTIMATED" | "VERIFIED" | "UNAVAILABLE";
  open_session: {id:number;started_at:string;ended_at:string|null;hours:number;impressions:number|null;measurement_status:string}|null;
  broadcast_sessions: {id:number;started_at:string;ended_at:string|null;hours:number;impressions:number|null;measurement_status:"DEMO"|"ESTIMATED"|"VERIFIED"}[];
  vehicle: number | null; vehicle_summary: {id:number;registration_number:string;vehicle_model:string;vehicle_type:string;status:string}|null;
};
export type Page<T> = {count: number; next: string | null; previous: string | null; results: T[]};
export const campaignApi = {
  list: (query = "") => api<Page<Campaign> | Campaign[]>(`/campaigns/${query}`),
  create: (value: Partial<Campaign>) => api<Campaign>("/campaigns/", {method:"POST", body:JSON.stringify(value)}),
  update: (id: string | number, value: Partial<Campaign>) => api<Campaign>(`/campaigns/${id}/`, {method:"PATCH", body:JSON.stringify(value)}),
  remove: (id: string | number) => api(`/campaigns/${id}/`, {method:"DELETE"}),
};

export const driverCampaignApi = {
  available: (query = "") => api<Campaign[]>(`/driver/campaigns/${query}`),
  mine: () => api<CampaignParticipation[]>("/driver/campaigns/mine/"),
  demo: () => api<CampaignParticipation[]>("/driver/campaigns/demo/", {method:"POST", body:"{}"}),
  assignVehicle: (id: Campaign["id"], vehicleId: number | null) => api<CampaignParticipation>(`/driver/campaigns/${id}/vehicle/`, {method:"POST", body:JSON.stringify({vehicle_id:vehicleId})}),
  apply: (id: Campaign["id"]) => api<CampaignParticipation>(`/driver/campaigns/${id}/apply/`, {method:"POST", body:"{}"}),
  switchTo: (id: Campaign["id"]) => api<CampaignParticipation>(`/driver/campaigns/${id}/switch/`, {method:"POST", body:"{}"}),
  startBroadcast: (id: Campaign["id"]) => api<{participation:CampaignParticipation;session_id:number}>(`/driver/campaigns/${id}/start_broadcast/`, {method:"POST", body:"{}"}),
  stopBroadcast: (id: Campaign["id"]) => api<{session:{id:number;hours:number;measurement_status:string}}>(`/driver/campaigns/${id}/stop_broadcast/`, {method:"POST", body:"{}"}),
  withdraw: (id: Campaign["id"]) => api<CampaignParticipation>(`/driver/campaigns/${id}/withdraw/`, {method:"POST", body:"{}"}),
};
