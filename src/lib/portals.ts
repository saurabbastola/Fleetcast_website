/** Portals the login and sign-up pages can be opened for, via ?portal=<key>. */
export const PORTALS: Record<string, string> = {
  ads: "Ads Manager",
  fleet: "Fleet Owner Portal",
  developer: "Developer Portal",
};

/** Resolves ?portal= to a known key and its display name. */
export function resolvePortal(portal?: string) {
  const key = portal && PORTALS[portal] ? portal : undefined;
  return { key, name: key ? PORTALS[key] : "platform" };
}
