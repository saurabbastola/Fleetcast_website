"use client";

import { Fragment, useState } from "react";
import { MARK_PATH } from "@/components/Logo";
import Reveal from "@/components/Reveal";
import { useInView } from "@/lib/useInView";
import { attention } from "@/content/site";

/**
 * Headline + animated Fleetcast mark. The blocks "drive" in from the left,
 * the wordmark settles underneath. Click the logo to replay.
 */
export default function Attention() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.45 });
  const [run, setRun] = useState(0);
  const words = attention.title.split(" ");

  return (
    <section className="attention" aria-label="Capture attention">
      <div ref={ref} className={`attention__stage${inView ? " is-in" : ""}`} key={run}>
        <h2 className="attention__title">
          {words.map((w, i) => (
            <Fragment key={`${w}-${i}`}>
              <span className="attention__word" style={{ animationDelay: `${i * 55}ms` }}>
                {w}
              </span>{" "}
            </Fragment>
          ))}
        </h2>
        <button
          type="button"
          className="attention__logo"
          onClick={() => setRun((n) => n + 1)}
          aria-label="Replay Fleetcast logo animation"
        >
          <svg className="attention__mark" viewBox="-2 -2 74 52" aria-hidden="true">
            <path className="attention__block attention__block--1" d={MARK_PATH} />
            <rect className="attention__block attention__block--2" x="58" y="0" width="12" height="12" rx="2" />
            <rect className="attention__block attention__block--3" x="46" y="24" width="12" height="12" rx="2" />
          </svg>
          <span className="attention__wordmark">fleetcast</span>
        </button>
      </div>

      <Reveal className="attention__connects">
        <p>{attention.connects}</p>
      </Reveal>
    </section>
  );
}
