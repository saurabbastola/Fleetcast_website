"use client";

import Link from "next/link";
import { Mark } from "@/components/Logo";
import Reveal from "@/components/Reveal";
import { useAutoCycle } from "@/lib/useAutoCycle";
import { useInView } from "@/lib/useInView";
import { marketplace } from "@/content/site";

type Side = typeof marketplace.owners;

function Check() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="currentColor" opacity=".18" />
      <path d="M6 10.4l2.6 2.6L14.2 7.4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SideCard({ side, tone, delay }: { side: Side; tone: "navy" | "orange"; delay: number }) {
  return (
    <Reveal className={`market-card market-card--${tone}`} delay={delay} as="article">
      <p className="market-card__label">{side.label}</p>
      <h3 className="market-card__title">{side.headline}</h3>
      <ul className="market-card__list">
        {side.points.map((p) => (
          <li key={p}>
            <Check />
            {p}
          </li>
        ))}
      </ul>
      <Link href={side.cta.href} className={`btn btn--md ${tone === "navy" ? "btn--orange" : "btn--cream"}`}>
        {side.cta.label}
      </Link>
    </Reveal>
  );
}

/** Two-sided marketplace: owners ↔ Fleetcast hub ↔ advertisers, with a cycling example match. */
export default function Marketplace() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.25, once: false });
  const matches = marketplace.matches;
  const cycle = useAutoCycle({ count: matches.length, interval: 2800, inView });
  const i = cycle.index;
  const m = matches[i];

  return (
    <section className="market" id="marketplace" aria-labelledby="market-title">
      <Reveal className="market__head">
        <p className="eyebrow">{marketplace.eyebrow}</p>
        <h2 id="market-title" className="market__title">
          {marketplace.title}
        </h2>
      </Reveal>

      <div ref={ref} className={`market__grid${inView ? " is-live" : ""}`} data-status={cycle.status} data-index={i}>
        <SideCard side={marketplace.owners} tone="navy" delay={0} />

        <div className="market__hub" aria-hidden="true">
          <span className="market__wire market__wire--l" />
          <span className="market__wire market__wire--r" />
          <div className="market__core">
            <Mark />
          </div>
          <div className="market__ticket" key={i}>
            <span className="market__ticket-tag">Match</span>
            <strong>{m.brand}</strong>
            <span className="market__ticket-arrow">⇄</span>
            <strong>{m.vehicles}</strong>
            <span className="market__ticket-where">{m.where}</span>
          </div>
          <span className="market__ticket-note">Example match</span>
        </div>

        <SideCard side={marketplace.advertisers} tone="orange" delay={140} />
      </div>
    </section>
  );
}
