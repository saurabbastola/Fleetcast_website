"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import Reveal from "@/components/Reveal";
import { formats } from "@/content/site";

type Key = (typeof formats.items)[number]["key"];

function TabIcon({ kind }: { kind: Key }) {
  if (kind === "bus")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="5" width="20" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />
        <circle cx="7" cy="18.5" r="2" fill="currentColor" />
        <circle cx="17" cy="18.5" r="2" fill="currentColor" />
      </svg>
    );
  if (kind === "train")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2 6h15q4 0 5 5v4H2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M2 21h20" stroke="currentColor" strokeWidth="2" />
        <circle cx="6" cy="17.5" r="1.6" fill="currentColor" />
        <circle cx="17" cy="17.5" r="1.6" fill="currentColor" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="3" width="6" height="3" rx="1" fill="currentColor" />
      <path d="M3 16v-3l2-1 3-5h8l3 5 2 1v3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="7" cy="17.5" r="2" fill="currentColor" />
      <circle cx="17" cy="17.5" r="2" fill="currentColor" />
    </svg>
  );
}

/**
 * Bus / Train / Car & Taxi tabs. Each tab shows a real vehicle photo; the
 * placement buttons highlight where that placement sits on the vehicle.
 * State: { tab, placement }. Switching tab resets the placement to the first one.
 */
export default function Formats() {
  const [sel, setSel] = useState({ tab: 0, placement: 0 });
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const items = formats.items;
  const active = sel.tab;
  const item = items[active];
  const placement = item.placements[sel.placement] ?? item.placements[0];
  const spot = item.spots[placement];

  const select = (i: number, focus = false) => {
    const next = (i + items.length) % items.length;
    setSel((s) => (s.tab === next ? s : { tab: next, placement: 0 }));
    if (focus) tabs.current[next]?.focus();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") select(active + 1, true);
    else if (e.key === "ArrowLeft") select(active - 1, true);
    else if (e.key === "Home") select(0, true);
    else if (e.key === "End") select(items.length - 1, true);
    else return;
    e.preventDefault();
  };

  return (
    <section className="formats" id="formats" aria-labelledby="formats-title">
      <Reveal className="formats__head">
        <p className="eyebrow">{formats.eyebrow}</p>
        <h2 id="formats-title" className="formats__title">
          {formats.title}
        </h2>
      </Reveal>

      <Reveal className="formats__tabs" delay={80}>
        <div role="tablist" aria-label="Advertising formats" onKeyDown={onKey}>
          {items.map((f, i) => (
            <button
              key={f.key}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`fmt-tab-${f.key}`}
              aria-controls="fmt-panel"
              aria-selected={i === active}
              tabIndex={i === active ? 0 : -1}
              className={`formats__tab${i === active ? " is-active" : ""}`}
              onClick={() => select(i)}
            >
              <TabIcon kind={f.key} />
              {f.tab}
            </button>
          ))}
        </div>
      </Reveal>

      <div className="formats__panel" role="tabpanel" id="fmt-panel" aria-labelledby={`fmt-tab-${item.key}`}>
        <figure className={`formats__stage formats__stage--${item.key}`} key={item.key} data-placement={placement}>
          <Image src={item.photo.src} alt={item.photo.alt} fill sizes="(max-width: 1000px) 100vw, 55vw" />
          {spot && (
            <span
              className={`formats__spot${spot[1] < 15 ? " is-top" : ""}`}
              key={placement}
              aria-hidden="true"
              style={
                {
                  "--x": `${spot[0]}%`,
                  "--y": `${spot[1]}%`,
                  "--w": `${spot[2]}%`,
                  "--h": `${spot[3]}%`,
                } as CSSProperties
              }
            >
              <span className="formats__spot-label">{placement}</span>
            </span>
          )}
          <figcaption className="formats__caption" aria-live="polite">
            Showing: {placement}
          </figcaption>
        </figure>

        <div className="formats__info" key={`${item.key}-info`}>
          <p className="formats__label">{item.label}</p>
          <h3 className="formats__headline">{item.headline}</h3>
          <p className="formats__text">{item.text}</p>
          <dl className="formats__stats">
            {item.stats.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
          <div className="formats__placements" role="group" aria-label="Placements: choose one to see it on the vehicle">
            {item.placements.map((p, i) => (
              <button
                key={p}
                type="button"
                className={`formats__placement${p === placement ? " is-active" : ""}`}
                aria-pressed={p === placement}
                onClick={() => setSel((s) => ({ ...s, placement: i }))}
              >
                {p}
              </button>
            ))}
          </div>
          <Link href={item.cta.href} className="btn btn--orange btn--md">
            {item.cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
