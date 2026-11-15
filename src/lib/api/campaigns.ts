import { api } from "./client";
export type Campaign = {id: number | string; name: string; description: string; budget: string; start_date: string | null; end_date: string | null; status: string; created_at: string};
export type Page<T> = {count: number; next: string | null; previous: string | null; results: T[]};
export const campaignApi = {
  list: (query = "") => api<Page<Campaign> | Campaign[]>(`/campaigns/${query}`),
  create: (value: Partial<Campaign>) => api<Campaign>("/campaigns/", {method:"POST", body:JSON.stringify(value)}),
  update: (id: string | number, value: Partial<Campaign>) => api<Campaign>(`/campaigns/${id}/`, {method:"PATCH", body:JSON.stringify(value)}),
  remove: (id: string | number) => api(`/campaigns/${id}/`, {method:"DELETE"}),
};
