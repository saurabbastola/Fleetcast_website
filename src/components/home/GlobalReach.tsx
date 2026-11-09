import Link from "next/link";
import GlobalMap from "@/components/GlobalMap";
import Reveal from "@/components/Reveal";
import { globalReach } from "@/content/site";

export default function GlobalReach() {
  return (
    <section className="global" id="global" aria-label="Where we operate">
      <div className="global__grid">
        <div className="global__copy">
          <Reveal>
            <h2 className="global__title">{globalReach.title}</h2>
          </Reveal>
          {globalReach.paragraphs.map((p, i) => (
            <Reveal key={p} delay={80 + i * 70}>
              <p className="global__text">{p}</p>
            </Reveal>
          ))}
        </div>
        <div className="global__map">
          <GlobalMap markets={globalReach.markets} />
        </div>
      </div>
      <div className="global__cta">
        <Link href={globalReach.cta.href} className="btn btn--orange btn--lg">
          {globalReach.cta.label}
        </Link>
      </div>
    </section>
  );
}
