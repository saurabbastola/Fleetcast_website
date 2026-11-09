import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { hero } from "@/content/site";

/** Splits the title so its last words (hero.titleAccent) can take the accent colour. */
function Title() {
  const { title, titleAccent } = hero;
  if (!titleAccent || !title.endsWith(titleAccent)) return <>{title}</>;
  return (
    <>
      {title.slice(0, -titleAccent.length)}
      <em className="hero__accent">{titleAccent}</em>
    </>
  );
}

/**
 * Home hero: dark, cinematic split with a photo collage. Styles live in
 * styles/hero.css and are scoped to `.hero`, so nothing here leaks to other sections.
 */
export default function Hero() {
  const { images } = hero;
  return (
    <section className="hero" data-nav-transparent aria-label="Introduction">
      <div className="hero__inner">
        <div className="hero__copy">
          <h1 className="hero__title anim-rise">
            <Title />
          </h1>
          <p className="hero__text anim-rise anim-delay-1">{hero.text}</p>
          <div className="hero__ctas anim-rise anim-delay-2">
            <Link href={hero.primaryCta.href} className="btn btn--orange btn--lg hero__cta">
              {hero.primaryCta.label}
              <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link href={hero.secondaryCta.href} className="btn hero__ghost">
              {hero.secondaryCta.label}
            </Link>
          </div>
        </div>

        <div className="hero__visual">
          <figure className="hero__shot hero__shot--main">
            <Image src={images.main.src} alt={images.main.alt} fill priority sizes="(max-width: 900px) 100vw, 46vw" />
          </figure>
          <figure className="hero__shot hero__shot--side">
            <Image src={images.side.src} alt={images.side.alt} fill sizes="(max-width: 900px) 50vw, 22vw" />
          </figure>
          <figure className="hero__shot hero__shot--card">
            <Image src={images.card.src} alt={images.card.alt} fill sizes="(max-width: 900px) 45vw, 20vw" />
          </figure>
        </div>
      </div>

      <div className="hero__statement">
        <Reveal className="hero__statement-main">
          <h2 className="hero__statement-title">{hero.statement}</h2>
        </Reveal>
        <Reveal delay={120} className="hero__statement-side">
          <p className="hero__intro">{hero.statementIntro}</p>
        </Reveal>
      </div>
    </section>
  );
}
