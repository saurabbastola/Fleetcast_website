"use client";

import type { CSSProperties } from "react";
import Reveal from "@/components/Reveal";
import { useAutoCycle } from "@/lib/useAutoCycle";
import { useInView } from "@/lib/useInView";
import { stages } from "@/content/site";

/**
 * Four stages on a road: a small car drives from stage to stage.
 * Auto-advances while visible (machine: lib/machines/cycle.ts). Hovering or
 * focusing a card previews it and pauses; clicking a pin stops the tour.
 */
export default function Stages() {
  const items = stages.items;
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.35, once: false });
  const cycle = useAutoCycle({
    count: items.length,
    interval: (i) => (i === items.length - 1 ? 4200 : 3000),
    inView,
  });
  const active = cycle.index;

  const progress = { "--p": active / (items.length - 1) } as CSSProperties;

  return (
    <section className="stages" id="stages" aria-labelledby="stages-title">
      <Reveal className="stages__head">
        <p className="eyebrow">{stages.eyebrow}</p>
        <h2 id="stages-title" className="stages__title">
          {stages.title}
        </h2>
      </Reveal>

      <div
        ref={ref}
        className="stages__body"
        style={progress}
        data-status={cycle.status}
        data-index={active}
        {...cycle.pauseProps}
      >
        <div className="stages__road">
          <span className="stages__fill" aria-hidden="true" />
          {items.map((s, i) => (
            <button
              key={s.n}
              type="button"
              className={`stages__pin${i <= active ? " is-on" : ""}`}
              style={{ left: `${(i / (items.length - 1)) * 100}%` }}
              onClick={() => cycle.go(i, { stop: true })}
              aria-current={i === active ? "step" : undefined}
              aria-label={`Stage ${s.n}: ${s.title}`}
            />
          ))}
          <span className="stages__car" aria-hidden="true">
            <svg viewBox="0 0 64 32">
              <path d="M4 24v-6q0-3 3-3.5l8-1 7-7.5h18l8 7.5 9 1.5q3 .5 3 3.5V24z" fill="var(--orange)" />
              <path d="M24 9h7v6H18zM34 9h5l6 6H34z" fill="var(--navy)" />
              <circle cx="16" cy="24" r="5" fill="var(--navy)" />
              <circle cx="48" cy="24" r="5" fill="var(--navy)" />
            </svg>
          </span>
          <span className="stages__flag" aria-hidden="true">
            Live
          </span>
        </div>

        <ol className="stages__list">
          {items.map((s, i) => (
            <li
              key={s.n}
              className={`stage${i === active ? " is-active" : ""}${i < active ? " is-done" : ""}`}
              onMouseEnter={() => cycle.go(i)}
            >
              <p className="stage__name">
                <span>{s.n}</span> {s.title}
              </p>
              <h3 className="stage__headline">{s.headline}</h3>
              <p className="stage__text">{s.text}</p>
              <span className="stage__who">{s.who}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
