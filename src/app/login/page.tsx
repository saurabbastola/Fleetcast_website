import type { Metadata } from "next";
import Link from "next/link";
import LoginCard from "@/components/LoginCard";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false },
};

const PORTALS: Record<string, string> = {
  ads: "Ads Manager",
  fleet: "Fleet Owner Portal",
  developer: "Developer Portal",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ portal?: string }> }) {
  const { portal } = await searchParams;
  const name = PORTALS[portal ?? ""] ?? "platform";
  return (
    <div className="login">
      <main className="login__main">
        <LoginCard portal={name} />
      </main>
      <footer className="login__foot">
        Need more information or help? <Link href="/resources/knowledge-center">Visit our Knowledge Base</Link>
      </footer>
    </div>
  );
}
