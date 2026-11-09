import type { Metadata } from "next";
import Link from "next/link";
import SignupCard from "@/components/SignupCard";
import { resolvePortal } from "@/lib/portals";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false },
};

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ portal?: string }> }) {
  const { portal } = await searchParams;
  const { key, name } = resolvePortal(portal);
  return (
    <div className="login">
      <main className="login__main">
        <SignupCard portal={name} portalKey={key} />
      </main>
      <footer className="login__foot">
        Need more information or help? <Link href="/resources/knowledge-center">Visit our Knowledge Base</Link>
      </footer>
    </div>
  );
}
