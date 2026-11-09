import Link from "next/link";
import Logo from "@/components/Logo";
import { footer, site } from "@/content/site";

function SocialIcon({ label }: { label: string }) {
  switch (label) {
    case "LinkedIn":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4V21H3zM9.5 9.75h3.8v1.6h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1V21h-4v-4.93c0-1.18-.02-2.7-1.64-2.7-1.65 0-1.9 1.29-1.9 2.62V21h-4z"
          />
        </svg>
      );
    case "Instagram":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" />
        </svg>
      );
    case "X":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M17.5 3h3.2l-7 8 8.3 10h-6.5l-5-6.2L4.8 21H1.6l7.5-8.6L1.2 3h6.6l4.6 5.7zm-1.1 16.2h1.8L6.7 4.7H4.8z"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2" y="5" width="20" height="14" rx="4" fill="currentColor" />
          <path d="M10 9v6l5-3z" fill="#DE4903" />
        </svg>
      );
  }
}

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="site-footer__brand">
          <Link href="/" aria-label="Fleetcast home">
            <Logo variant="stacked" />
          </Link>
          <p className="site-footer__tagline">{footer.tagline}</p>
        </div>
        <nav className="site-footer__cols" aria-label="Footer">
          {footer.columns.map((col, i) => (
            <ul key={i}>
              {col.map((l) => (
                <li key={l.label}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          ))}
        </nav>
      </div>
      <div className="site-footer__bottom">
        <p className="site-footer__address">
          {site.address} {site.phone}
          <br />© {year} {site.name}. All Rights Reserved.
        </p>
        {footer.legal.map((l) => (
          <Link key={l.label} href={l.href} className="site-footer__legal">
            {l.label}
          </Link>
        ))}
        <ul className="site-footer__social">
          {footer.social.map((s) => (
            <li key={s.label}>
              <a href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}>
                <SocialIcon label={s.label} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
