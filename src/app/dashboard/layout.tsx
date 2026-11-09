import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s | Fleetcast Dashboard" },
  robots: { index: false },
};

/** Signed-in area: no marketing header/footer, its own sidebar + account bar. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
