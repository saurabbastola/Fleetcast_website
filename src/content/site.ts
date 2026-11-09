/**
 * All copy, links and image paths for the Fleetcast site live here.
 * To swap photos: drop new files into /public/images and update the paths below
 * (or point them at Supabase Storage URLs later).
 */

export type NavCard = { title: string; text: string; href: string; image: string };
export type NavLink = { label: string; href: string };
export type NavItem =
  | { label: string; type: "cards"; items: NavCard[] }
  | { label: string; type: "list"; items: NavLink[] }
  | { label: string; type: "link"; href: string; pill?: boolean };

export const site = {
  name: "Fleetcast",
  url: "https://fleetcast.com",
  email: "hello@fleetcast.com",
  phone: "(000) 000-0000",
  address: "Your street address, City, ST 00000",
  description: "Fleetcast turns every vehicle into a moving billboard — one marketplace where fleet owners list their vehicles and advertisers book bus, train, car and taxi campaigns.",
};

export const nav: NavItem[] = [
  {
    label: "Solutions",
    type: "cards",
    items: [
      {
        title: "For Advertisers",
        text: "Book wraps, roof screens and QR campaigns on the routes your customers actually travel.",
        href: "/solutions/marketers",
        image: "/images/hero-city.jpg",
      },
      {
        title: "For Fleet Owners",
        text: "List a car, a taxi or a whole depot of buses and get paid for the miles you already drive.",
        href: "/solutions/fleet-owners",
        image: "/images/case-trails.jpg",
      },
      {
        title: "For Retailers",
        text: "Put your offer on the street outside your store, then count every scan that walks in.",
        href: "/solutions/retailers",
        image: "/images/menu-retail.jpg",
      },
    ],
  },
  {
    label: "Formats",
    type: "list",
    items: [
      { label: "Bus Advertising", href: "/formats/bus" },
      { label: "Train Advertising", href: "/formats/train" },
      { label: "Car & Taxi Advertising", href: "/formats/car-taxi" },
      { label: "Vehicle Wraps", href: "/formats/vehicle-wraps" },
      { label: "Interactive QR Campaigns", href: "/formats/qr-campaigns" },
    ],
  },
  {
    label: "Products",
    type: "list",
    items: [
      { label: "Campaign Builder", href: "/products/ads-manager" },
      { label: "Fleet Owner Portal", href: "/products/fleet-owner-portal" },
      { label: "Route Insights", href: "/products/audience-insights" },
      { label: "Wrap Studio", href: "/products/creative-studio" },
    ],
  },
  {
    label: "Resources",
    type: "cards",
    items: [
      {
        title: "Playbooks & Guides",
        text: "Campaign breakdowns, wrap specs, pricing guides and QR best practice.",
        href: "/resources/knowledge-center",
        image: "/images/audience-crosswalk.jpg",
      },
      {
        title: "Fleetcast Academy",
        text: "Short courses for owners and marketers who are new to moving media.",
        href: "/resources/academy",
        image: "/images/owners-street.jpg",
      },
      {
        title: "Installer Network",
        text: "Find certified wrap installers and print partners near your depot.",
        href: "/resources/partners",
        image: "/images/audience-facade.jpg",
      },
    ],
  },
  {
    label: "About",
    type: "list",
    items: [
      { label: "Our Story", href: "/about/our-story" },
      { label: "Our Team", href: "/about/our-team" },
      { label: "Careers", href: "/about/careers" },
      { label: "News", href: "/about/news" },
    ],
  },
  { label: "Contact", type: "link", href: "/contact", pill: true },
  {
    label: "Login",
    type: "list",
    items: [
      { label: "Advertiser Login", href: "/login?portal=ads" },
      { label: "Fleet Owner Portal", href: "/login?portal=fleet" },
      { label: "Developer Portal", href: "/login?portal=developer" },
      { label: "Create an account", href: "/signup" },
    ],
  },
];

export const languages = ["EN", "FR", "ES", "DE"];

export const hero = {
  title: "Turn every vehicle into a moving billboard.",
  /** The end of `title` that gets the accent colour. */
  titleAccent: "moving billboard.",
  text: "Stunning vehicle wraps and interactive QR campaigns on buses, trains, cars and taxis, booked in one place and measured every mile.",
  primaryCta: { label: "Start a campaign", href: "/contact" },
  secondaryCta: { label: "List your vehicle", href: "#marketplace" },
  /** Hero collage: a large lead photo, a supporting photo and a floating dashboard card. */
  images: {
    main: { src: "/images/bus-dusk.jpg", alt: "City bus at dusk wrapped with an advertiser's campaign and a QR code" },
    side: { src: "/images/city-fleet.jpg", alt: "Wrapped buses, taxis and trucks in a busy city street" },
    card: { src: "/images/dashboard-advertiser.jpg", alt: "Fleetcast campaign dashboard showing impressions, QR scans and engagement" },
  },
  statementIntro: "Parked vehicles earn nothing and blank buses say nothing. Fleetcast puts brands on the vehicles that are already out on the road.",
  statement: "Your brand rides where your customers already go.",
};

export const goal = {
  tag: "Here's the idea.",
  paragraphs: [
    "Every bus, train carriage, taxi and family car is a surface that passes thousands of people a day. Most of them carry no message at all.",
    "Fleetcast gives those surfaces a job. Owners earn from the miles they already drive, and advertisers reach real streets with a scannable call to action.",
  ],
};

export const attention = {
  title: "Billboards stand still. Yours doesn't have to.",
  connects: "Owners bring the miles. Advertisers bring the message. Fleetcast brings them together.",
};

/** Two-sided marketplace: vehicle owners on one side, advertisers on the other. */
export const marketplace = {
  eyebrow: "One platform, two sides",
  title: "Where vehicle owners and advertisers meet.",
  owners: {
    label: "Vehicle owners",
    headline: "Your vehicle earns while it drives.",
    points: [
      "List one car or a full depot in under ten minutes",
      "Approve every brand before it rides on your vehicle",
      "Free professional wrap install and removal",
      "Monthly payouts based on verified miles",
    ],
    cta: { label: "List my vehicle", href: "/solutions/fleet-owners" },
  },
  advertisers: {
    label: "Advertisers",
    headline: "Book the street like you book search.",
    points: [
      "Filter vehicles by city, route, hours and format",
      "Design wraps with our studio or upload your own",
      "Add a QR code that links the street to your site",
      "Live dashboard for miles, impressions and scans",
    ],
    cta: { label: "Plan a campaign", href: "/solutions/marketers" },
  },
  /** Illustrative examples of how a match reads in the platform, not real bookings. */
  matches: [
    { brand: "Coffee chain", vehicles: "18 taxis", where: "Downtown loop" },
    { brand: "Fitness app", vehicles: "6 city buses", where: "University routes" },
    { brand: "Furniture store", vehicles: "40 rideshare cars", where: "Suburban ring" },
    { brand: "Music festival", vehicles: "2 commuter trains", where: "North line" },
  ],
};

/**
 * Bus / Train / Car & Taxi showcase.
 * PLACEHOLDER figures: replace the stats with your own verified numbers before launch.
 */
/** A highlighted area on a photo, in percent: [left, top, width, height]. */
export type Spot = [number, number, number, number];

export const formats = {
  eyebrow: "Explore formats",
  title: "Pick your vehicle. We'll make it unmissable.",
  items: [
    {
      key: "bus" as const,
      label: "Bus advertising",
      tab: "Bus",
      headline: "City-sized canvases on fixed, predictable routes.",
      text: "Buses run the same streets all day, every day, past the same commuters, shoppers and students. They're the most reliable way to own a neighbourhood.",
      stats: [
        { value: "16 hrs", label: "on the road per day" },
        { value: "40 ft", label: "of wrap per side" },
        { value: "Fixed", label: "routes you choose" },
      ],
      placements: ["Full wrap", "Side panels", "Rear window", "Interior cards"],
      photo: { src: "/images/network-bus.jpg", alt: "City bus wrapped with advertisers' panels along its side" },
      spots: {
        "Full wrap": [1, 37, 98, 57],
        "Side panels": [20.5, 66, 72, 23],
        "Rear window": [91.5, 51, 7.5, 16],
        "Interior cards": [21, 47, 73, 19],
      } as Record<string, Spot>,
      cta: { label: "Plan a bus campaign", href: "/formats/bus" },
    },
    {
      key: "train" as const,
      label: "Train advertising",
      tab: "Train",
      headline: "Commuter attention, carriage after carriage.",
      text: "Trains carry people who have time to look. Exterior wraps reach platforms and level crossings, and in-carriage panels hold a captive audience for the whole ride.",
      stats: [
        { value: "20+ min", label: "average dwell time" },
        { value: "Platform", label: "and trackside reach" },
        { value: "Daily", label: "repeat commuters" },
      ],
      placements: ["Full livery", "Carriage panels", "Door wraps", "In-car screens"],
      photo: { src: "/images/network-train.jpg", alt: "Commuter train at a platform with a wrapped carriage panel and QR code" },
      spots: {
        "Full livery": [0, 12, 100, 72],
        "Carriage panels": [12.5, 50, 73.5, 30],
        "Door wraps": [80, 34, 13, 33],
        "In-car screens": [25.5, 25, 50, 24],
      } as Record<string, Spot>,
      cta: { label: "Plan a train campaign", href: "/formats/train" },
    },
    {
      key: "taxi" as const,
      label: "Car & taxi advertising",
      tab: "Car & Taxi",
      headline: "Street-level reach that goes where people go.",
      text: "Taxis, rideshare and everyday cars cover the whole city: airports, nightlife, school runs and side streets. Add a digital roof topper and your message can change by time and place.",
      stats: [
        { value: "Citywide", label: "coverage, not one route" },
        { value: "Roof", label: "screens that change by area" },
        { value: "From 1", label: "vehicle and up" },
      ],
      placements: ["Full or partial wrap", "Door panels", "Digital roof topper", "Rear window"],
      photo: { src: "/images/network-car.jpg", alt: "Yellow taxi with a pink partial wrap across both doors" },
      spots: {
        "Full or partial wrap": [1, 46, 97, 45],
        "Door panels": [34, 58, 51, 26],
        "Digital roof topper": [45, 38.5, 19, 8],
        "Rear window": [72, 49, 12, 9],
      } as Record<string, Spot>,
      cta: { label: "Plan a car & taxi campaign", href: "/formats/car-taxi" },
    },
  ],
};

/** Four stages from a parked vehicle to a live campaign. */
export const stages = {
  eyebrow: "How it works",
  title: "From parked vehicle to live campaign in four stages.",
  items: [
    {
      n: "01",
      title: "List",
      headline: "Add your vehicle",
      text: "Owners add the vehicle type, the usual routes and when it's on the road. Fleets can bulk-upload a whole depot.",
      who: "Vehicle owner",
    },
    {
      n: "02",
      title: "Match",
      headline: "Get matched with a brand",
      text: "Advertisers search by city, route and format. The owner sees each offer up front and accepts only the brands they're happy to carry.",
      who: "Both sides",
    },
    {
      n: "03",
      title: "Wrap",
      headline: "Design, print and install",
      text: "The Wrap Studio fits the design to the exact vehicle model. A certified installer applies it, and a photo check-in confirms it's on.",
      who: "Fleetcast",
    },
    {
      n: "04",
      title: "Drive",
      headline: "Go live and track every mile",
      text: "GPS logs every route and QR scans show who responded. Advertisers see results in real time, and owners get paid monthly.",
      who: "Both sides",
    },
  ],
};

/** Vehicle wraps + interactive QR campaigns. */
export const wrapsQr = {
  eyebrow: "Wraps + QR",
  title: "Wraps that turn heads. QR codes that turn heads into customers.",
  wraps: {
    title: "Stunning vehicle wraps",
    text: "Choose how much of the vehicle carries your brand. Tap a style to preview it.",
    styles: [
      { key: "full" as const, label: "Full wrap", detail: "Bumper to bumper, the most impact" },
      { key: "partial" as const, label: "Partial wrap", detail: "Lower body and doors, a smart budget" },
      { key: "windows" as const, label: "Window graphics", detail: "Perforated film, clear view from inside" },
      { key: "topper" as const, label: "Digital roof topper", detail: "Lit screen that changes by area" },
    ],
    cta: { label: "Explore wrap styles", href: "/formats/vehicle-wraps" },
  },
  qr: {
    title: "Interactive QR campaigns",
    text: "Every wrap can carry a QR code, which turns a passing vehicle into a clickable ad. Scans are tied to the vehicle, the street and the hour, so you can see which routes actually bring in customers.",
    steps: [
      { title: "Scan", text: "Someone points their phone at the vehicle." },
      { title: "Land", text: "They open your offer, menu or signup page." },
      { title: "Act", text: "They claim the deal, book or get directions." },
      { title: "Measure", text: "You see scans by street and time of day." },
    ],
    cta: { label: "Launch a QR campaign", href: "/formats/qr-campaigns" },
  },
};

export const studio = {
  titleDark: "A vehicle gets you seen.",
  titleAccent: "A great wrap gets you remembered.",
  text: "The Fleetcast Wrap Studio designs for curves, doors and windows, not flat rectangles. Every design is checked for legibility at speed, matched to the exact vehicle model and paired with a QR placement that's easy to scan.",
  cta: { label: "See the Wrap Studio", href: "/products/creative-studio" },
  video: "/video/fleetcast-reel.mp4",
  poster: "/video/fleetcast-reel-poster.jpg",
};

export const globalReach = {
  title: "Local enough for one street. Big enough for every city.",
  paragraphs: [
    "A taxi rank, a school-run route or a single commuter line can be the whole campaign. Pick the streets that matter and leave the rest out.",
    "When you're ready to scale, the same booking flow covers fleets in dozens of countries, so you don't need a new vendor for every market.",
    "Wherever the vehicles are, the reporting looks the same: miles driven, hours on the road and QR scans by location.",
  ],
  cta: { label: "Check coverage in your city", href: "/contact" },
  /** ISO 3166-1 numeric codes highlighted on the map. */
  markets: [
    "840",
    "124",
    "484",
    "076",
    "032",
    "152",
    "170",
    "604",
    "826",
    "372",
    "250",
    "724",
    "620",
    "056",
    "528",
    "276",
    "756",
    "380",
    "040",
    "208",
    "578",
    "752",
    "246",
    "616",
    "203",
    "792",
    "376",
    "784",
    "682",
    "012",
    "566",
    "710",
    "156",
    "392",
    "410",
    "158",
    "608",
    "704",
    "764",
    "458",
    "360",
    "036",
    "554",
  ],
};

/**
 * PLACEHOLDER testimonials — replace with real, approved client quotes before launch.
 */
export const testimonials = {
  title: "Heard from the driver's seat and the boardroom.",
  items: [
    {
      quote:
        "“Placeholder testimonial: a short, specific quote from a client about why they chose Fleetcast, what it was like to work with the team, and the results their campaign delivered.”",
      name: "Client Name",
      role: "Title, Department",
      company: "Company Name",
      logo: "CLIENT LOGO",
    },
    {
      quote:
        "“Placeholder testimonial: a fleet owner explains how Fleetcast turned their vehicles into a new revenue stream and how simple the onboarding was.”",
      name: "Fleet Partner Name",
      role: "Title, Department",
      company: "Fleet Company",
      logo: "PARTNER LOGO",
    },
    {
      quote:
        "“Placeholder testimonial: an agency describes how Fleetcast data and creative helped them plan, launch and measure a campaign across several cities.”",
      name: "Agency Contact",
      role: "Title, Department",
      company: "Agency Name",
      logo: "AGENCY LOGO",
    },
  ],
};

/**
 * "Trusted by" logo showcase (replaces the old placeholder awards).
 *
 * To use a real logo, put the file in public/logos/ and set `logo`, e.g.
 *   { name: "Uber", logo: "/logos/uber.svg" }
 * Without `logo`, the brand name is shown as a clean text wordmark.
 * Only list brands you actually work with and have permission to show.
 */
export type TrustedLogo = { name: string; logo?: string; href?: string };

export const trustedBy = {
  eyebrow: "Brands on the road",
  title: "Trusted by forward-thinking brands",
  text: "From one street to every city, these brands ride where their customers are, and see every scan, mile and impression.",
  logos: [
    { name: "Uber" },
    { name: "Lyft" },
    { name: "DoorDash" },
    { name: "Red Bull" },
    { name: "Spotify" },
    { name: "Ben's Chili Bowl" },
    { name: "Chipotle" },
  ] as TrustedLogo[],
};

export const caseStudies = {
  eyebrow: "Field notes",
  title: "Guides for anyone putting a brand on wheels.",
  items: [
    {
      tone: "orange" as const,
      eyebrow: "Downloadables",
      title: "Bus, train or taxi? Choosing the right vehicle for your goal",
      href: "/resources/guide-fleet-advertising",
      image: "/images/case-trails.jpg",
    },
    {
      tone: "peach" as const,
      eyebrow: "Downloadables",
      title: "Designing a wrap people can read at 50 km/h",
      href: "/resources/guide-fleet-partner",
      image: "/images/case-towers.jpg",
    },
    {
      tone: "navy" as const,
      eyebrow: "Downloadables",
      title: "QR on the move: getting scans, not squints",
      href: "/resources/guide-audience-targeting",
      image: "/images/case-plaza.jpg",
    },
  ],
};

export const contactCta = {
  title: "Ready to hit the road?",
  text: "Got a vehicle that could be earning, or a brand that should be moving? Tell us what you have and where you drive, and we'll come back with routes, formats and a price within one business day.",
  cta: { label: "Put my brand on the road", href: "/contact" },
};

export const footer = {
  tagline: "Every vehicle, a moving billboard",
  columns: [
    [
      { label: "For Advertisers", href: "/solutions/marketers" },
      { label: "For Vehicle Owners", href: "/solutions/fleet-owners" },
      { label: "Bus, Train, Car & Taxi", href: "/formats/bus" },
    ],
    [
      { label: "Campaign Builder", href: "/products/ads-manager" },
      { label: "Fleet Operations", href: "/products/fleet-owner-portal" },
    ],
    [
      { label: "Blog", href: "/resources/blog" },
      { label: "News", href: "/about/news" },
      { label: "Fleetcast Academy", href: "/resources/academy" },
    ],
    [
      { label: "Our Story", href: "/about/our-story" },
      { label: "Our Team", href: "/about/our-team" },
      { label: "Careers", href: "/about/careers" },
    ],
    [
      { label: "Advertiser Login", href: "/login?portal=ads" },
      { label: "Fleet Owner Login", href: "/login?portal=fleet" },
      { label: "Developer Portal", href: "/login?portal=developer" },
      { label: "Create an account", href: "/signup" },
    ],
  ],
  legal: [
    { label: "Cookie Settings", href: "/legal/cookies" },
    { label: "Website privacy notice", href: "/legal/privacy" },
  ],
  social: [
    { label: "LinkedIn", href: "https://www.linkedin.com/" },
    { label: "Instagram", href: "https://www.instagram.com/" },
    { label: "X", href: "https://x.com/" },
    { label: "YouTube", href: "https://www.youtube.com/" },
  ],
};

export const playbook = {
  title: "The moving billboard playbook",
  text: "Wrap specs, route planning and QR tactics in one free guide",
  cta: "Get it now",
  coverEyebrow: "Free guide:",
  coverTitle: "From parked vehicle to paying billboard",
};

/** Placeholder pages generated for every internal link that doesn't have a real page yet. */
export function placeholderPages(): { slug: string[]; title: string }[] {
  const hrefs = new Set<string>();
  nav.forEach((item) => {
    if (item.type === "link") hrefs.add(item.href);
    else item.items.forEach((i) => hrefs.add(i.href));
  });
  [marketplace.owners.cta, marketplace.advertisers.cta].forEach((c) => hrefs.add(c.href));
  formats.items.forEach((f) => hrefs.add(f.cta.href));
  hrefs.add(wrapsQr.wraps.cta.href);
  hrefs.add(wrapsQr.qr.cta.href);
  hrefs.add(studio.cta.href);
  caseStudies.items.forEach((c) => hrefs.add(c.href));
  footer.columns.flat().forEach((l) => hrefs.add(l.href));
  footer.legal.forEach((l) => hrefs.add(l.href));

  const out: { slug: string[]; title: string }[] = [];
  hrefs.forEach((href) => {
    const path = href.split("?")[0].split("#")[0];
    if (!path.startsWith("/") || path === "/" || path === "/contact" || path === "/login") return;
    const slug = path.replace(/^\//, "").split("/");
    const title = slug[slug.length - 1].replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
    out.push({ slug, title });
  });
  return out;
}

/** Simple index used by the header search. */
export function searchIndex(): { title: string; href: string; group: string }[] {
  const out: { title: string; href: string; group: string }[] = [];
  nav.forEach((item) => {
    if (item.type === "cards") item.items.forEach((c) => out.push({ title: c.title, href: c.href, group: item.label }));
    if (item.type === "list") item.items.forEach((l) => out.push({ title: l.label, href: l.href, group: item.label }));
    if (item.type === "link") out.push({ title: item.label, href: item.href, group: "Company" });
  });
  caseStudies.items.forEach((c) => out.push({ title: c.title, href: c.href, group: "Resources" }));
  out.push({ title: "Bus, train, car & taxi formats", href: "/#formats", group: "Home" });
  out.push({ title: "How it works", href: "/#stages", group: "Home" });
  out.push({ title: "Vehicle wraps & QR campaigns", href: "/#wraps", group: "Home" });
  out.push({ title: "Wrap Studio", href: "/#studio", group: "Home" });
  out.push({ title: "Where we operate", href: "/#global", group: "Home" });
  out.push({ title: "Testimonials", href: "/#testimonials", group: "Home" });
  const seen = new Set<string>();
  return out.filter((r) => (seen.has(r.title + r.href) ? false : (seen.add(r.title + r.href), true)));
}
