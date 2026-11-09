import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { caseStudies } from "@/content/site";

export default function CaseStudies() {
  return (
    <section className="cases" aria-label="Case studies">
      <Reveal className="cases__head">
        <p className="eyebrow">{caseStudies.eyebrow}</p>
        <h2 className="cases__title">{caseStudies.title}</h2>
      </Reveal>
      <div className="cases__grid">
        {caseStudies.items.map((c, i) => (
          <Reveal key={c.title} delay={i * 110} className="cases__cell">
            <Link href={c.href} className={`case-card case-card--${c.tone}`}>
              <span className="case-card__img">
                <Image src={c.image} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" />
              </span>
              <span className="case-card__body">
                <span className="case-card__eyebrow">{c.eyebrow}</span>
                <span className="case-card__title">{c.title}</span>
                <span className="btn btn--sm case-card__btn">Read more</span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
