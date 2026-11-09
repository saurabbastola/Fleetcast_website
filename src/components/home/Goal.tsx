"use client";

import BubbleConnector from "@/components/BubbleConnector";
import { useInView } from "@/lib/useInView";
import { goal } from "@/content/site";

export default function Goal() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.35 });
  return (
    <section className="goal" aria-label="Our goal">
      <div ref={ref} className={`goal__bubble${inView ? " is-in" : ""}`}>
        <p className="goal__tag">{goal.tag}</p>
        <div className="goal__box">
          <BubbleConnector className="goal__joint" />
          <div className="goal__copy">
            {goal.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
