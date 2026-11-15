"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { dashboardPath } from "@/lib/api/auth";

/** Shows the landing page to signed-out visitors and sends signed-in ones to /dashboard. */
export default function HomeGate({ children }: { children: ReactNode }) {
  const { isLoggedIn, account } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (isLoggedIn && account) router.replace(dashboardPath(account.role));
  }, [isLoggedIn, account, router]);
  return <>{children}</>;
}
