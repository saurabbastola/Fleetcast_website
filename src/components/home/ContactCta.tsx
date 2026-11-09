import Link from "next/link";
import Reveal from "@/components/Reveal";
import { contactCta } from "@/content/site";

export default function ContactCta() {
  return (
    <section className="cta" aria-label="Contact us">
      <Reveal>
        <h2 className="cta__title">{contactCta.title}</h2>
      </Reveal>
      <Reveal delay={90}>
        <p className="cta__text">{contactCta.text}</p>
      </Reveal>
      <Reveal delay={160}>
        <Link href={contactCta.cta.href} className="btn btn--orange btn--xl">
          {contactCta.cta.label}
        </Link>
      </Reveal>
    </section>
  );
}
