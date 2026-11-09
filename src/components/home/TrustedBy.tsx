import Image from "next/image";
import Reveal from "@/components/Reveal";
import { trustedBy, type TrustedLogo } from "@/content/site";

/** One logo tile: the real asset if `logo` is set, otherwise a text wordmark placeholder. */
function LogoTile({ item }: { item: TrustedLogo }) {
  const mark = item.logo ? (
    <Image
      src={item.logo}
      alt={item.name}
      width={160}
      height={56}
      className="trusted__img"
      unoptimized={item.logo.endsWith(".svg")}
    />
  ) : (
    <span className="trusted__wordmark">{item.name}</span>
  );
  return (
    <div className="trusted__tile" data-placeholder={item.logo ? undefined : ""}>
      {item.href ? (
        <a href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.name}>
          {mark}
        </a>
      ) : (
        mark
      )}
    </div>
  );
}

/**
 * "Trusted by" logo marquee. The list is rendered twice so the CSS loop is
 * seamless; the copy is aria-hidden. Pauses on hover/focus, and turns into a
 * static wrapped grid for visitors who prefer reduced motion.
 */
export default function TrustedBy() {
  const { logos } = trustedBy;
  return (
    <section className="trusted" aria-labelledby="trusted-title">
      <Reveal className="trusted__head">
        <p className="eyebrow eyebrow--cream">{trustedBy.eyebrow}</p>
        <h2 id="trusted-title" className="trusted__title">
          {trustedBy.title}
        </h2>
        <p className="trusted__text">{trustedBy.text}</p>
      </Reveal>

      <Reveal className="trusted__marquee" effect="fade" delay={120}>
        <div className="trusted__track">
          <ul className="trusted__list">
            {logos.map((l) => (
              <li key={l.name}>
                <LogoTile item={l} />
              </li>
            ))}
          </ul>
          <ul className="trusted__list trusted__list--copy" aria-hidden="true">
            {logos.map((l) => (
              <li key={l.name}>
                <LogoTile item={{ ...l, href: undefined }} />
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
