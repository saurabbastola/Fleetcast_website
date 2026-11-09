import Attention from "@/components/home/Attention";
import CaseStudies from "@/components/home/CaseStudies";
import ContactCta from "@/components/home/ContactCta";
import Formats from "@/components/home/Formats";
import GlobalReach from "@/components/home/GlobalReach";
import Goal from "@/components/home/Goal";
import Hero from "@/components/home/Hero";
import Marketplace from "@/components/home/Marketplace";
import Stages from "@/components/home/Stages";
import Studio from "@/components/home/Studio";
import Testimonials from "@/components/home/Testimonials";
import TrustedBy from "@/components/home/TrustedBy";
import WrapsQr from "@/components/home/WrapsQr";

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="mint-block">
        <Goal />
        <Attention />
        <Marketplace />
      </div>
      <Formats />
      <Stages />
      <WrapsQr />
      <Studio />
      <GlobalReach />
      <section className="proof" id="testimonials" aria-label="Testimonials and brands">
        <Testimonials />
        <TrustedBy />
      </section>
      <CaseStudies />
      <ContactCta />
    </>
  );
}
