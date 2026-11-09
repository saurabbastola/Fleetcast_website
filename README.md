# Fleetcast website

Marketing site for Fleetcast, built with **Next.js (App Router) + TypeScript + plain CSS**.
It's ready for **Supabase** (forms and login) and **Vercel** (hosting).

## Run it locally

You need Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

| Page | URL |
| --- | --- |
| Home | `/` |
| Contact form | `/contact` |
| Login (Supabase auth) | `/login` (also `/login?portal=fleet`, `/login?portal=developer`) |
| Placeholder pages for every menu/footer link | e.g. `/solutions/marketers` |

## What's interactive

- **Header**: hides when you scroll down and comes back when you scroll up. It's transparent over the hero and turns navy further down the page. Solutions and Resources open card mega‑menus; Products, About and Login open list menus. Contact gets a pill on hover. There's a language picker, a search panel (press Esc to close) and a full mobile menu.
- **Hero**: dark "night drive" layout with a three-photo collage (lead photo, supporting photo, floating dashboard card) and load animations. All its styles are in `styles/hero.css`, scoped to `.hero`.
- **"Our goal is simple."**: a speech-bubble tag joined to the box below by an SVG connector (`components/BubbleConnector.tsx`).
- **Logo animation**: the Fleetcast blocks "drive" in when the section scrolls into view. Click the logo to replay it.
- **Marketplace** (`#marketplace`): vehicle owners and advertisers side by side, with a pulsing Fleetcast hub and a cycling example match in the middle.
- **Formats** (`#formats`): Bus, Train and Car & Taxi tabs (arrow keys work). Each tab shows a real vehicle photo. Clicking a placement (e.g. Side panels) highlights where it sits on the vehicle. Photos and highlight boxes are in `site.ts` → `formats.items[].photo` / `.spots` (percent of the photo: left, top, width, height).
- **Four stages** (`#stages`): List → Match → Wrap → Drive. A car drives along the road from stage to stage. Hovering or focusing a card previews that stage and pauses the tour; clicking a pin stops it for good.
- **Wraps + QR** (`#wraps`): pick Full wrap, Partial, Window graphics or Digital roof topper to repaint the car preview. A phone mock-up cycles through the QR journey (scan → land → act → measure) and pauses on hover.
- **Creative Studio video**: a custom player that autoplays muted when it scrolls into view and pauses when it scrolls away, until the visitor uses a control. It has play/pause, seek, mute, picture‑in‑picture and fullscreen.
- **World map**: active markets fill in from west to east, and hovering a country shows a tooltip. Change the markets in `content/site.ts` → `globalReach.markets` (ISO numeric codes).
- **Testimonials**: a carousel that advances every 8 seconds. It pauses on hover or focus, when scrolled offscreen, in a background tab, and for visitors who prefer reduced motion (as do all auto-advancing sections). Use the dots, the arrow keys or a swipe to move between quotes.
- **Trusted by**: a logo marquee of brand tiles that loops on its own and pauses on hover or focus (a static grid with reduced motion). Edit `site.ts` → `trustedBy.logos`; add `logo: "/logos/name.svg"` to swap a text placeholder for a real logo file in `public/logos/`.
- **Case studies**: cards lift on hover.
- **Playbook pop‑up**: slides in after about 1.4s on desktop, or after scrolling past the hero on phones. Closing it hides it for 7 days. "Get it now" opens an email form that posts to `/api/leads`; once someone signs up, the pop-up doesn't come back.

## State machines

Every interactive piece runs on a small, pure reducer in `src/lib/machines/` (no React, no DOM), with an ASCII diagram at the top of each file:

| Machine | Used by | States |
| --- | --- | --- |
| `overlay.ts` | Header | `none` · `menu(id)` · `lang` · `search` · `mobile(section)`, so only one can be open at a time |
| `cycle.ts` | Stages, Wraps + QR, Testimonials, Marketplace (through `lib/useAutoCycle.ts`) | `playing` · `paused` (with reasons: hover, focus, offscreen, hidden-tab, reduced-motion) · `stopped` |
| `submit.ts` | Contact form, playbook form (through `lib/useSubmit.ts`) | `idle` · `submitting` · `success` · `error` |
| `login.ts` | `/login` | `checking` · `email` · `password` (busy: sign-in or reset) · `signedIn` |
| `video.ts` | Creative Studio player | `idle` · `playing` · `paused` · `ended`, plus who started playback |
| `playbook.ts` | Playbook pop-up | `waiting` · `visible` · `form` · `dismissed` |

Components show their current state in the DOM, so you can read it in devtools, CSS, end-to-end tests or browser agents: `header[data-overlay]`, `[data-status]` (carousels, forms, video, map), `.login-card[data-step]`, `.playbook[data-phase]`, and `[data-index]` on sequences.

To change a behaviour, edit the reducer and add a case to `machines.test.ts`:

```bash
npm test        # node --test, needs Node 23.6+ (runs TypeScript directly)
npm run typecheck
```

## Change text, links and photos

Nearly everything is in **`src/content/site.ts`**: nav menus, headlines, cards, testimonials, footer links and the image paths.

**Photos.** The images in `public/images/` are generated placeholders. Replace them with real photos by keeping the same file names, or by changing the paths in `site.ts`.

| File | Where it shows | Suggested size |
| --- | --- | --- |
| `bus-dusk.jpg` | Hero, lead photo | 1600×900 |
| `city-fleet.jpg` | Hero, supporting photo | 1600×900 |
| `dashboard-advertiser.jpg` | Hero, floating card | 1500×1000 |
| `network-bus.jpg`, `network-train.jpg`, `network-car.jpg` | Explore formats photos | 1200×900 |
| `owners-portrait.jpg`, `owners-street.jpg` | "Fleet Owners → to Marketers" card | 1000×700 |
| `audience-facade.jpg`, `audience-crosswalk.jpg` | "Marketers → to Audiences" card | 1000×700 |
| `case-trails.jpg`, `case-towers.jpg`, `case-plaza.jpg` | Case study cards | 1200×900 |
| `menu-retail.jpg` | Solutions mega‑menu thumbnail | 900×700 |

**Video.** Replace `public/video/fleetcast-reel.mp4` and `fleetcast-reel-poster.jpg`.

**Before launch:** the testimonials, the "Trusted by" brand list, address, phone number and the format stats in `formats.items[].stats` are placeholders. Swap in real, approved content.

**Colors, fonts and the design tokens** live in `src/styles/base.css`: colours (`--orange`, `--mint`, `--navy`, `--peach`), the type scale (`--fs-h2`, `--fs-h3`, `--fs-lead`), radii (`--radius`, `--radius-btn`) and shadows (`--shadow-sm/md/lg`). Buttons are at least 44px tall. The fonts are Hanken Grotesk (display) and Instrument Sans (UI), loaded with `next/font` in `src/app/layout.tsx`.

## Connect Supabase

1. Create a project at https://supabase.com.
2. In **SQL Editor**, run `supabase/schema.sql`. It creates `contact_submissions` and `playbook_leads`, with insert-only Row Level Security.
3. Copy `.env.example` to `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # or the publishable key
   ```
4. Restart `npm run dev`. The contact form and the playbook form will now save rows to Supabase. Until you connect it, submissions are only logged in the terminal.
5. **Login:** create users under **Authentication → Users**. `/login` uses email and password (`signInWithPassword`) and has a "Forgot password?" reset link.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel, choose **Add New → Project** and import the repo. The framework is detected as Next.js.
3. Add the same environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and optionally `NEXT_PUBLIC_AFTER_LOGIN_URL`).
4. Deploy. In Supabase → Authentication → URL Configuration, add your Vercel domain so password‑reset links work.

## Project structure

```
src/
  app/
    layout.tsx              fonts, global CSS, metadata
    (site)/layout.tsx       header + footer + pop-up
    (site)/page.tsx         home page
    (site)/contact/         contact page
    (site)/[...slug]/       placeholder pages for menu links
    login/                  login page (no site chrome)
    api/contact, api/leads  Supabase inserts
  components/               Header, Footer, VideoPlayer, GlobalMap, …
  components/home/          one file per home-page section
  content/site.ts           all copy, links and image paths
  lib/                      supabase client, useInView, useAutoCycle, useSubmit
  lib/machines/             pure state machines + their tests
  styles/                   base, header, home, components, pages
supabase/schema.sql
```
