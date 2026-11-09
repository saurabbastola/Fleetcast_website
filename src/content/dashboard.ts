/**
 * Dashboard copy and SAMPLE data. Nothing here comes from the database yet:
 * the dashboard shows a "Sample data" badge until these are wired to real tables.
 */

export type DashNavItem = { label: string; href?: string; icon: "home" | "megaphone" | "truck" | "brush" | "chart" | "gear" };

/** Items without `href` aren't built yet and render as "Soon". */
export const dashNav: DashNavItem[] = [
  { label: "Overview", href: "/dashboard", icon: "home" },
  { label: "Campaigns", icon: "megaphone" },
  { label: "Fleet", icon: "truck" },
  { label: "Creative studio", icon: "brush" },
  { label: "Analytics", icon: "chart" },
  { label: "Settings", href: "/dashboard/settings", icon: "gear" },
];

export const metrics = [
  { label: "Impressions", value: "2.48M", delta: "+12.4%", trend: "up" as const, spark: [12, 14, 13, 17, 16, 19, 22, 21, 25, 27] },
  { label: "QR scans", value: "18,420", delta: "+8.1%", trend: "up" as const, spark: [8, 9, 11, 10, 12, 12, 14, 13, 15, 16] },
  { label: "Active vehicles", value: "64", delta: "+6 this month", trend: "up" as const, spark: [50, 52, 52, 55, 57, 58, 58, 61, 62, 64] },
  { label: "Scan rate", value: "0.74%", delta: "−0.1 pts", trend: "down" as const, spark: [9, 9, 8.6, 8.8, 8.2, 8.1, 7.9, 7.8, 7.6, 7.4] },
];

export type CampaignStatus = "Live" | "Scheduled" | "In production" | "Draft";

export const campaigns: {
  name: string;
  format: string;
  vehicles: string;
  status: CampaignStatus;
  impressions: string;
  scans: string;
}[] = [
  { name: "Spring menu launch", format: "Bus", vehicles: "24 buses", status: "Live", impressions: "1.12M", scans: "9,840" },
  { name: "Downtown store opening", format: "Car & Taxi", vehicles: "18 taxis", status: "Live", impressions: "684K", scans: "5,210" },
  { name: "Festival weekend", format: "Train", vehicles: "6 carriages", status: "Scheduled", impressions: "—", scans: "—" },
  { name: "Holiday roof toppers", format: "Car & Taxi", vehicles: "16 cars", status: "In production", impressions: "—", scans: "—" },
  { name: "Gym membership push", format: "Bus", vehicles: "—", status: "Draft", impressions: "—", scans: "—" },
];

export const fleetMix = [
  { label: "Buses", count: 24 },
  { label: "Cars & taxis", count: 28 },
  { label: "Train carriages", count: 12 },
];

export const topStreets = [
  { street: "Main St", scans: 3120 },
  { street: "Station Sq", scans: 2410 },
  { street: "5th Ave", scans: 1630 },
  { street: "Harbour Rd", scans: 1020 },
];
