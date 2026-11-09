"use client";

import { useRef } from "react";
import BubbleConnector from "@/components/BubbleConnector";
import Reveal from "@/components/Reveal";
import { useAutoCycle } from "@/lib/useAutoCycle";
import { useInView } from "@/lib/useInView";
import { testimonials } from "@/content/site";

const INTERVAL = 8000;

/** Carousel. Pauses on hover/focus, offscreen, in a background tab and with reduced motion. */
export default function Testimonials() {
  const items = testimonials.items;
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3, once: false });
  const { index, status, go, next, prev, pauseProps } = useAutoCycle({ count: items.length, interval: INTERVAL, inView });
  const touchX = useRef<number | null>(null);

  return (
    <div
      ref={ref}
      className="testi"
      data-status={status}
      data-index={index}
      {...pauseProps}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
        if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
        touchX.current = null;
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Client testimonials"
    >
      <Reveal>
        <h2 className="testi__title">{testimonials.title}</h2>
      </Reveal>

      <Reveal className="testi__stage" delay={100}>
        <div className="testi__box">
          {items.map((t, i) => (
            <figure
              key={t.name + i}
              className={`testi__slide${i === index ? " is-active" : ""}`}
              aria-hidden={i !== index}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${items.length}`}
            >
              <blockquote className="testi__quote">{t.quote}</blockquote>
              <figcaption className="testi__by">
                <span>{t.name}</span>
                <span>{t.role}</span>
                <span>{t.company}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="testi__logo-box">
          <BubbleConnector className="testi__joint" />
          {items.map((t, i) => (
            <span key={t.logo + i} className={`testi__logo${i === index ? " is-active" : ""}`} aria-hidden={i !== index}>
              {t.logo}
            </span>
          ))}
        </div>
      </Reveal>

      <div className="testi__dots" role="tablist" aria-label="Choose testimonial">
        {items.map((t, i) => (
          <button
            key={t.name + i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Show testimonial ${i + 1}`}
            className={i === index ? "is-active" : ""}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
  );
}
