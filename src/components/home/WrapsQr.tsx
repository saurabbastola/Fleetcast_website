"use client";

import Link from "next/link";
import { useState } from "react";
import Reveal from "@/components/Reveal";
import { QrGlyph, Taxi, type TaxiMode } from "@/components/Vehicles";
import { useAutoCycle } from "@/lib/useAutoCycle";
import { useInView } from "@/lib/useInView";
import { wrapsQr } from "@/content/site";

/** Illustrative phone screens for the QR journey: scan → land → act → measure. */
function PhoneScreen({ step }: { step: number }) {
  if (step === 0)
    return (
      <div className="phone__screen phone__screen--scan">
        <div className="phone__viewfinder">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <QrGlyph x={20} y={20} size={80} />
          </svg>
          <span className="phone__scanline" />
        </div>
        <p>Point camera at the vehicle</p>
      </div>
    );
  if (step === 1)
    return (
      <div className="phone__screen phone__screen--land">
        <span className="phone__chip">Spotted on taxi · Main St</span>
        <p className="phone__brand">YOUR BRAND</p>
        <p className="phone__offer">20% off your first order</p>
        <span className="phone__btn">Claim offer</span>
      </div>
    );
  if (step === 2)
    return (
      <div className="phone__screen phone__screen--act">
        <span className="phone__tick" aria-hidden="true">
          ✓
        </span>
        <p className="phone__offer">Offer saved</p>
        <p className="phone__small">Nearest store · 300 m away</p>
        <span className="phone__btn">Get directions</span>
      </div>
    );
  const bars = [
    { k: "Main St", v: 92 },
    { k: "Station Sq", v: 71 },
    { k: "5th Ave", v: 48 },
    { k: "Harbour Rd", v: 30 },
  ];
  return (
    <div className="phone__screen phone__screen--measure">
      <p className="phone__small">Scans by street · today</p>
      <ul className="phone__bars">
        {bars.map((b, i) => (
          <li key={b.k}>
            <span>{b.k}</span>
            <i style={{ width: `${b.v}%`, animationDelay: `${i * 90}ms` }} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function WrapsQr() {
  const [mode, setMode] = useState<TaxiMode>("full");
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3, once: false });
  const steps = wrapsQr.qr.steps;
  const cycle = useAutoCycle({ count: steps.length, interval: 2600, inView });
  const step = cycle.index;

  return (
    <section className="wraps" id="wraps" aria-labelledby="wraps-title">
      <Reveal className="wraps__head">
        <p className="eyebrow eyebrow--cream">{wrapsQr.eyebrow}</p>
        <h2 id="wraps-title" className="wraps__title">
          {wrapsQr.title}
        </h2>
      </Reveal>

      <div className="wraps__grid">
        {/* ---- Wraps ---- */}
        <Reveal className="wraps__card wraps__card--wrap">
          <h3 className="wraps__card-title">{wrapsQr.wraps.title}</h3>
          <p className="wraps__card-text">{wrapsQr.wraps.text}</p>
          <div className="wraps__preview">
            <Taxi mode={mode} />
          </div>
          <div className="wraps__styles" role="radiogroup" aria-label="Wrap style" data-value={mode}>
            {wrapsQr.wraps.styles.map((s) => (
              <button
                key={s.key}
                type="button"
                role="radio"
                aria-checked={mode === s.key}
                className={`wraps__style${mode === s.key ? " is-active" : ""}`}
                onClick={() => setMode(s.key)}
              >
                <strong>{s.label}</strong>
                <span>{s.detail}</span>
              </button>
            ))}
          </div>
          <Link href={wrapsQr.wraps.cta.href} className="btn btn--orange btn--md">
            {wrapsQr.wraps.cta.label}
          </Link>
        </Reveal>

        {/* ---- QR ---- */}
        <Reveal className="wraps__card wraps__card--qr" delay={120}>
          <h3 className="wraps__card-title">{wrapsQr.qr.title}</h3>
          <p className="wraps__card-text">{wrapsQr.qr.text}</p>
          <div
            ref={ref}
            className="wraps__qr"
            data-status={cycle.status}
            data-index={step}
            {...cycle.pauseProps}
          >
            <div className="phone" aria-hidden="true">
              <span className="phone__notch" />
              <div className="phone__inner" key={step}>
                <PhoneScreen step={step} />
              </div>
            </div>
            <ol className="wraps__steps">
              {steps.map((s, i) => (
                <li key={s.title} className={i === step ? "is-active" : ""}>
                  <button type="button" onClick={() => cycle.go(i)} aria-current={i === step ? "step" : undefined}>
                    <span className="wraps__step-n">{i + 1}</span>
                    <span>
                      <strong>{s.title}</strong>
                      <em>{s.text}</em>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <Link href={wrapsQr.qr.cta.href} className="btn btn--cream btn--md">
            {wrapsQr.qr.cta.label}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
