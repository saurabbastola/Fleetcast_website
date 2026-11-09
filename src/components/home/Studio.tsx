import Link from "next/link";
import Reveal from "@/components/Reveal";
import VideoPlayer from "@/components/VideoPlayer";
import { studio } from "@/content/site";

export default function Studio() {
  return (
    <section className="studio" id="studio" aria-label="Creative Studio">
      <div className="studio__copy">
        <Reveal>
          <h2 className="studio__title">
            {studio.titleDark} <span className="text-orange">{studio.titleAccent}</span>
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="studio__text">{studio.text}</p>
        </Reveal>
        <Reveal delay={180} className="studio__cta">
          <Link href={studio.cta.href} className="btn btn--orange btn--md">
            {studio.cta.label}
          </Link>
        </Reveal>
      </div>
      <Reveal className="studio__media" effect="fade">
        <VideoPlayer src={studio.video} poster={studio.poster} label="Fleetcast Creative Studio reel" />
      </Reveal>
    </section>
  );
}
