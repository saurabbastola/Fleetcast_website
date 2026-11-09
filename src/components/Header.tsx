"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import AccountMenu, { ACCOUNT_LINKS, Avatar, useSignOutToHome } from "@/components/account/AccountMenu";
import Logo from "@/components/Logo";
import { languages, nav, searchIndex, type NavItem } from "@/content/site";
import { useAuth } from "@/lib/auth";
import { overlayKey, overlayNone, overlayReducer } from "@/lib/machines/overlay";

function Caret() {
  return (
    <svg className="caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
      <path d="M0 0h10L5 6z" fill="currentColor" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <path d="M15.5 15.5 22 22" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M3 3l14 14M17 3 3 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function slugify(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/**
 * Site header. Two independent pieces of state:
 * - `overlay` (lib/machines/overlay.ts): which ONE of mega-menu / language list /
 *   search / mobile drawer is open. Exposed as `data-overlay` on <header>.
 * - headroom (`hidden`, `solid`): derived from scroll position.
 * When signed in (useAuth), the "Login" menu becomes the account menu (overlay id "account").
 */
export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [overlay, dispatch] = useReducer(overlayReducer, overlayNone);
  const { account } = useAuth();
  const signOutToHome = useSignOutToHome();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState("EN");
  const openMenu = overlay.kind === "menu" ? overlay.id : null;
  const langOpen = overlay.kind === "lang";
  const searchOpen = overlay.kind === "search";
  const mobileOpen = overlay.kind === "mobile";
  const mobileSection = overlay.kind === "mobile" ? overlay.section : null;
  const closeTimer = useRef<number | null>(null);
  const searchInput = useRef<HTMLInputElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  const index = useMemo(() => searchIndex(), []);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return index.slice(0, 6);
    return index.filter((r) => r.title.toLowerCase().includes(q) || r.group.toLowerCase().includes(q)).slice(0, 8);
  }, [index, query]);

  // Close everything when the route changes.
  useEffect(() => {
    dispatch({ type: "CLOSE_ALL" });
  }, [pathname]);

  // Headroom: hide on scroll down, reveal on scroll up; go solid once past the hero.
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const transparentEnd = () => {
      const els = document.querySelectorAll<HTMLElement>("[data-nav-transparent]");
      if (!els.length) return -1;
      let end = 0;
      els.forEach((el) => {
        end = Math.max(end, el.getBoundingClientRect().bottom + window.scrollY);
      });
      return end - 90;
    };
    const update = () => {
      const y = window.scrollY;
      setSolid(y > transparentEnd());
      if (y < 120) setHidden(false);
      else if (y > lastY + 6) {
        setHidden(true);
        dispatch({ type: "DISMISS_POPOVERS" });
      } else if (y < lastY - 6) setHidden(false);
      lastY = y;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  // Escape closes menus; clicking outside closes dropdowns.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dispatch({ type: "CLOSE_ALL" });
    };
    const onDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) dispatch({ type: "DISMISS_POPOVERS" });
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  // Lock page scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (searchOpen) {
      const t = window.setTimeout(() => searchInput.current?.focus(), 120);
      return () => window.clearTimeout(t);
    }
  }, [searchOpen]);

  // The drawer is a phone/tablet thing: close it if the window grows past the burger breakpoint.
  useEffect(() => {
    if (!mobileOpen) return;
    const wide = window.matchMedia("(min-width: 1181px)");
    const onChange = () => wide.matches && dispatch({ type: "CLOSE_ALL" });
    onChange();
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, [mobileOpen]);

  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  const hoverItem = useCallback(
    (item: NavItem) => {
      cancelClose();
      // Hovering a plain link closes an open mega-menu, like before.
      dispatch(item.type === "link" ? { type: "CLOSE_MENU" } : { type: "OPEN_MENU", id: item.label });
    },
    [cancelClose]
  );

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => dispatch({ type: "CLOSE_MENU" }), 180);
  }, [cancelClose]);

  const chooseLang = (l: string) => {
    setLang(l);
    dispatch({ type: "SELECT_LANG" });
    document.documentElement.lang = l.toLowerCase();
  };

  const renderPanel = (item: NavItem) => {
    if (item.type === "cards") {
      return (
        <div className="mega mega--cards" id={`menu-${slugify(item.label)}`}>
          {item.items.map((card) => (
            <Link key={card.title} href={card.href} className="mega-card">
              <strong className="mega-card__title">{card.title}</strong>
              <span className="mega-card__text">{card.text}</span>
              <span className="mega-card__img">
                <Image src={card.image} alt="" fill sizes="140px" />
              </span>
            </Link>
          ))}
        </div>
      );
    }
    if (item.type === "list") {
      return (
        <div className="mega mega--list" id={`menu-${slugify(item.label)}`}>
          {item.items.map((l) => (
            <Link key={l.label} href={l.href} className="mega-link">
              {l.label}
            </Link>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <header
      ref={headerRef}
      data-overlay={overlayKey(overlay)}
      className={`site-header${hidden && overlay.kind === "none" ? " is-hidden" : ""}${solid ? " is-solid" : ""}${
        mobileOpen ? " is-mobile-open" : ""
      }`}
    >
      <div className="site-header__inner">
        <Link href="/" className="site-header__logo" aria-label="Fleetcast home">
          <Logo />
        </Link>

        <nav className="main-nav" aria-label="Main">
          <ul className="main-nav__list" onMouseLeave={scheduleClose}>
            {nav.map((item) => {
              const isOpen = openMenu === item.label;
              if (account && item.label === "Login") {
                return (
                  <li key="account" className="main-nav__item main-nav__item--end main-nav__item--account" onMouseEnter={cancelClose}>
                    <AccountMenu
                      account={account}
                      tone="light"
                      open={openMenu === "account"}
                      onOpenChange={(v) => dispatch(v ? { type: "TOGGLE_MENU", id: "account" } : { type: "CLOSE_MENU" })}
                    />
                  </li>
                );
              }
              return (
                <li
                  key={item.label}
                  className={`main-nav__item main-nav__item--${item.type}${isOpen ? " is-open" : ""}${
                    item.label === "Login" ? " main-nav__item--end" : ""
                  }`}
                  onMouseEnter={() => hoverItem(item)}
                >
                  {item.type === "link" ? (
                    <Link href={item.href} className={`main-nav__link${item.pill ? " main-nav__link--pill" : ""}`}>
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="main-nav__link"
                      aria-expanded={isOpen}
                      aria-controls={`menu-${slugify(item.label)}`}
                      onClick={() => {
                        cancelClose();
                        dispatch({ type: "TOGGLE_MENU", id: item.label });
                      }}
                    >
                      {item.label}
                    </button>
                  )}
                  {item.type !== "link" && renderPanel(item)}
                </li>
              );
            })}
          </ul>

          <div className={`lang${langOpen ? " is-open" : ""}`}>
            <button
              type="button"
              className="lang__btn"
              aria-haspopup="listbox"
              aria-expanded={langOpen}
              onClick={() => dispatch({ type: "TOGGLE_LANG" })}
            >
              <span>{lang}</span>
              <Caret />
            </button>
            <ul className="lang__list" role="listbox" aria-label="Language">
              {languages.map((l) => (
                <li key={l}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={l === lang}
                    className={l === lang ? "is-active" : ""}
                    onClick={() => chooseLang(l)}
                  >
                    {l}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            className="icon-btn search-btn"
            aria-label="Search"
            aria-expanded={searchOpen}
            onClick={() => dispatch({ type: "TOGGLE_SEARCH" })}
          >
            <SearchIcon />
          </button>
        </nav>

        <button
          type="button"
          className={`burger${mobileOpen ? " is-open" : ""}`}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => dispatch({ type: "TOGGLE_MOBILE" })}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Search panel */}
      <div className={`search-panel${searchOpen ? " is-open" : ""}`} aria-hidden={!searchOpen}>
        <div className="search-panel__inner">
          <form
            role="search"
            className="search-panel__form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!results[0]) return;
              dispatch({ type: "CLOSE_ALL" });
              router.push(results[0].href);
            }}
          >
            <SearchIcon />
            <input
              ref={searchInput}
              type="search"
              placeholder="Search Fleetcast"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search the site"
              tabIndex={searchOpen ? 0 : -1}
            />
            <button type="button" className="icon-btn" aria-label="Close search" onClick={() => dispatch({ type: "CLOSE_ALL" })}>
              <CloseIcon />
            </button>
          </form>
          <ul className="search-panel__results">
            {results.length ? (
              results.map((r) => (
                <li key={r.title + r.href}>
                  <Link href={r.href} tabIndex={searchOpen ? 0 : -1} onClick={() => dispatch({ type: "CLOSE_ALL" })}>
                    <span className="search-panel__group">{r.group}</span>
                    <span>{r.title}</span>
                  </Link>
                </li>
              ))
            ) : (
              <li className="search-panel__empty">No results for &ldquo;{query}&rdquo;</li>
            )}
          </ul>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`mobile-menu${mobileOpen ? " is-open" : ""}`} aria-hidden={!mobileOpen}>
        <ul className="mobile-menu__list">
          {nav.map((item) =>
            account && item.label === "Login" ? (
              <li key="account" className="mobile-account">
                <div className="mobile-account__who">
                  <Avatar account={account} size={40} />
                  <span>
                    <strong>{account.name}</strong>
                    <em>{account.email}</em>
                  </span>
                </div>
                <div className="mobile-account__links">
                  {ACCOUNT_LINKS.map((l) => (
                    <Link key={l.href} href={l.href} tabIndex={mobileOpen ? 0 : -1}>
                      {l.label}
                    </Link>
                  ))}
                  <button type="button" tabIndex={mobileOpen ? 0 : -1} onClick={() => void signOutToHome()}>
                    Sign out
                  </button>
                </div>
              </li>
            ) : (
            <li key={item.label} className={mobileSection === item.label ? "is-open" : ""}>
              {item.type === "link" ? (
                <Link href={item.href} className="mobile-menu__top" tabIndex={mobileOpen ? 0 : -1}>
                  {item.label}
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    className="mobile-menu__top"
                    aria-expanded={mobileSection === item.label}
                    tabIndex={mobileOpen ? 0 : -1}
                    onClick={() => dispatch({ type: "TOGGLE_SECTION", id: item.label })}
                  >
                    {item.label}
                    <Caret />
                  </button>
                  <div className="mobile-menu__sub">
                    {item.type === "cards"
                      ? item.items.map((c) => (
                          <Link key={c.title} href={c.href} tabIndex={mobileOpen ? 0 : -1}>
                            <strong>{c.title}</strong>
                            <span>{c.text}</span>
                          </Link>
                        ))
                      : item.items.map((l) => (
                          <Link key={l.label} href={l.href} tabIndex={mobileOpen ? 0 : -1}>
                            <strong>{l.label}</strong>
                          </Link>
                        ))}
                  </div>
                </>
              )}
            </li>
            )
          )}
        </ul>
        <div className="mobile-menu__foot">
          <div className="mobile-menu__langs">
            {languages.map((l) => (
              <button
                key={l}
                type="button"
                className={l === lang ? "is-active" : ""}
                onClick={() => chooseLang(l)}
                tabIndex={mobileOpen ? 0 : -1}
              >
                {l}
              </button>
            ))}
          </div>
          <Link href="/contact" className="btn btn--cream" tabIndex={mobileOpen ? 0 : -1}>
            Get in touch
          </Link>
        </div>
      </div>
    </header>
  );
}
