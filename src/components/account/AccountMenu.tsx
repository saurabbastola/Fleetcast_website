"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Account } from "@/lib/machines/session";
import { useAuth } from "@/lib/auth";

/** Round avatar: the Google photo when there is one, otherwise initials. */
export function Avatar({ account, size = 34 }: { account: Account; size?: number }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden="true">
      {account.avatarUrl && !broken ? (
        // Plain <img>: Google avatar hosts would otherwise need next/image remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={account.avatarUrl} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
      ) : (
        account.initials
      )}
    </span>
  );
}

export const ACCOUNT_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Settings", href: "/dashboard/settings" },
];

/** Signs out, then returns to the public landing page. */
export function useSignOutToHome() {
  const { signOut } = useAuth();
  const router = useRouter();
  return async () => {
    await signOut();
    router.replace("/");
  };
}

type Props = {
  account: Account;
  /** Controlled open state, so the site header can keep only one dropdown open at a time. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** "light" text for dark backgrounds (site header), "dark" for light ones. */
  tone?: "light" | "dark";
  showName?: boolean;
};

/**
 * Avatar button + dropdown: name/email, Dashboard, Settings, Sign out.
 * Works controlled (site header) or on its own (dashboard bar).
 */
export default function AccountMenu({ account, open: openProp, onOpenChange, tone = "dark", showName = true }: Props) {
  const [openLocal, setOpenLocal] = useState(false);
  const open = openProp ?? openLocal;
  const setOpen = (v: boolean) => (onOpenChange ? onOpenChange(v) : setOpenLocal(v));
  const root = useRef<HTMLDivElement | null>(null);
  const signOutToHome = useSignOutToHome();

  // Uncontrolled use: close on outside click / Escape. (The site header handles these itself.)
  useEffect(() => {
    if (!open || onOpenChange) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpenLocal(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenLocal(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={root} className={`account account--${tone}${open ? " is-open" : ""}`} data-state={open ? "open" : "closed"}>
      <button
        type="button"
        className="account__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen(!open)}
      >
        <Avatar account={account} />
        {showName && <span className="account__name">{account.name}</span>}
        <svg className="account__caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
          <path d="M0 0h10L5 6z" fill="currentColor" />
        </svg>
        <span className="sr-only">Account menu</span>
      </button>
      <div className="account__menu" id="account-menu" role="menu" hidden={!open}>
        <div className="account__who">
          <strong>{account.name}</strong>
          <span>{account.email}</span>
        </div>
        {ACCOUNT_LINKS.map((l) => (
          <Link key={l.href} href={l.href} role="menuitem" className="account__item" onClick={() => setOpen(false)}>
            {l.label}
          </Link>
        ))}
        <button
          type="button"
          role="menuitem"
          className="account__item account__item--out"
          onClick={() => {
            setOpen(false);
            void signOutToHome();
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
