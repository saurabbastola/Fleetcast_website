import HomeGate from "@/components/home/HomeGate";
import LandingPage from "@/components/home/LandingPage";

/**
 * Home. Signed-out visitors see the marketing landing page; signed-in visitors
 * are sent to their dashboard (HomeGate). The landing page is still server-rendered
 * for everyone, so search engines and first paint are unaffected.
 */
export default function HomePage() {
  return (
    <HomeGate>
      <LandingPage />
    </HomeGate>
  );
}
