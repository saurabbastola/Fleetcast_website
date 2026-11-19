# Fleetcast website

Fleetcast vehicle advertising platform, built with **Next.js (App Router) + TypeScript + plain CSS**, backed by Django REST Framework and Supabase PostgreSQL/Storage.

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
| Login | `/login` (also `/login?portal=fleet`, `/login?portal=developer`) |
| Create an account | `/signup` (same `?portal=` options) |
| Dashboard (signed in) | `/dashboard`, `/dashboard/settings` |
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

## Signed-in experience

Sign-in state comes from Django's JWT session in HttpOnly cookies: `AuthProvider` (in `src/app/layout.tsx`) loads `/api/v1/auth/profile/`, and components read `useAuth()` → `{ isLoggedIn, account, signOut }`. Access and refresh tokens are not exposed to browser JavaScript. The API client refreshes expired sessions and sends CSRF tokens on writes.

- **Signed out:** the public landing page (`components/home/LandingPage.tsx`).
- **Signed in:** opening `/` goes to `/dashboard` (`HomeGate`). On marketing pages the header's *Login* menu becomes the account menu: avatar, name, Dashboard, Settings, Sign out (`components/account/AccountMenu.tsx`).
- **Business dashboard** (`/dashboard`): campaign and account counts come from Django. Impressions, QR scans, payment figures, and street analytics show as unavailable until supported by backend data.
- **Driver dashboard** (`/dashboard`): discover active campaigns, apply, view accepted campaigns, select the current ad, and start/stop a driver-reported broadcast timer. Sample records are visibly marked demo. Earnings are estimates from recorded hours and the campaign rate; impressions stay unavailable unless a demo fixture supplies clearly labeled values.
- **Admin dashboard** (`/dashboard/admin`): platform counts and approval queues are protected by Django role permissions.
- **Management pages**: `/dashboard/campaigns` is advertiser campaign management or the driver campaign marketplace depending on role; `/dashboard/advertisements`, `/dashboard/vehicles`, `/dashboard/payments`, `/dashboard/notifications`, and `/dashboard/profile` remain role-scoped. Driver earnings/activity is at `/dashboard/earnings`. Admin lists are under `/dashboard/admin/`.
- **Settings** (`/dashboard/settings`): updates the Django user profile, supports password changes, and lets a verified user add a Business or Driver workspace to the same email account. A top-bar selector switches between enabled workspaces.
- **Sign out** returns to the landing page.

## State machines

Every interactive piece runs on a small, pure reducer in `src/lib/machines/` (no React, no DOM), with an ASCII diagram at the top of each file:

| Machine | Used by | States |
| --- | --- | --- |
| `overlay.ts` | Header | `none` · `menu(id)` · `lang` · `search` · `mobile(section)`, so only one can be open at a time |
| `cycle.ts` | Stages, Wraps + QR, Testimonials, Marketplace (through `lib/useAutoCycle.ts`) | `playing` · `paused` (with reasons: hover, focus, offscreen, hidden-tab, reduced-motion) · `stopped` |
| `submit.ts` | Contact form, playbook form (through `lib/useSubmit.ts`) | `idle` · `submitting` · `success` · `error` |
| `login.ts` | `/login` | `checking` · `email` · `password` (busy: sign-in or reset) · `redirecting` (to Google) · `signedIn` |
| `session.ts` | Whole app, via `lib/auth.tsx` → `useAuth()` | `loading` · `signedIn(account)` · `signedOut(byUser)`, which is the real "isLoggedIn" |
| `signup.ts` | `/signup` | `form` (busy: create or google) · `verify` (6-digit code) · `done` |
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

## Django backend and Supabase database

The Django REST API is the application backend. Next.js does not use Supabase Auth or query application tables directly. Supabase PostgreSQL remains the database and Supabase Storage is accessed only by Django. The frontend environment file contains only `NEXT_PUBLIC_API_URL`.

### Start the frontend

```bash
npm install
cp .env.example .env.local
npm run dev
```

### Start Django

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Set SECRET_KEY, DATABASE_URL, allowed origins, and OAuth/storage values in this ignored file.
python manage.py runserver
```

The public Supabase schema was inventoried read-only. It contains `contact_submissions`, `playbook_leads`, and `profiles`; no public business, driver, vehicle, advertisement, campaign, payment, or notification tables were present. The existing lead tables are mapped as unmanaged Django models, so their schema is preserved. `profiles.id` references `auth.users`; the profile table and Supabase Auth records are not modified by Django migrations.

When `DATABASE_URL` is blank, local development uses a fresh `backend/development-local.sqlite3`. The older `backend/development.sqlite3` is left untouched because its built-in migration history predates the custom user model.

Initial Django migrations create the new application tables (`accounts_user`, business/driver profiles, vehicles, advertisements, campaigns, payments, and notifications), along with Django's framework tables. They contain only additive table creation/related framework migrations and were applied after the read-only schema/Auth/Storage inventory confirmed no existing domain tables. Existing Supabase Auth users and `public.profiles` were not changed. The inventory found 3 Supabase Auth users, with identity rows for `email` (1) and `google` (3), and no Storage buckets. The counts do not reveal which provider identities belong to which users; account mapping still needs a controlled staging review.

Campaign marketplace relationships, participation, and broadcast sessions are additive migrations. `campaigns.0003_campaignparticipation_vehicle` links a campaign participation to the driver's vehicle. `vehicles.0002_vehicle_is_demo` identifies demo vehicles, `advertisements.0002_advertisement_is_demo` marks server-created demo creatives, and `campaigns.0004_broadcastsession_vehicle` snapshots the assigned vehicle on each session so later reassignment does not rewrite history. Render applies these migrations and runs the idempotent `seed_demo_campaigns --skip-assets` command. This creates 12 visibly labeled `DEMO` campaigns and approved creative records; it does not create login credentials or assign demo activity to a real driver.

Advertisement review is restricted to the account named by `DEVELOPER_EMAIL` (defaults to `saurabbanstola5@gmail.com`). Business users cannot set approval status. With `FLEETCAST_DEMO_MODE=True`, new uploaded ads and campaigns are server-marked as demo and ads are auto-approved so the demonstration flow can be tried without review. Keep that switch off on a production service; with it off, new ads remain pending until the designated developer approves them.

The separate `seed_demo_fleet` command is for a development database only. It requires an already existing active account with a Driver workspace and refuses to create a user or change non-demo vehicles. Set `DEBUG=True` and `FLEETCAST_DEMO_MODE=True` only in the local development environment, ensure `DATABASE_URL` points to the intended development database, then run from `backend/`:

```bash
python manage.py seed_demo_fleet --email saurabbanstola5@gmail.com
```

This creates one verified (`APPROVED`) vehicle marked `is_demo`, links it to seeded demo campaign participation, and adds clearly labeled sample broadcast history. Add `--with-assets` only when the development environment has private Supabase Storage buckets and credentials configured; without it, creative previews can be unavailable. Do not enable demo mode on Render or point this command at production data.

Driver dashboard summary and vehicle activity use the same stored vehicle, campaign, advertisement, and broadcast-session relations. `GET /api/v1/vehicles/{id}/activity/` only returns vehicles owned by the authenticated driver and preserves completed campaign history. Timer sessions and impressions remain demo/estimated unless a trusted measurement source is added; no GPS or hardware tracking is implemented.

Set up Google as a **Web application** OAuth client in [Google Cloud Console](https://console.cloud.google.com). Add the exact server callback URL from `GOOGLE_REDIRECT_URI` to Authorized redirect URIs (local default: `http://localhost:8000/api/v1/auth/google/callback/`). Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` only in Django's private `.env`. For production use HTTPS, `COOKIE_SECURE=True`, and the exact production frontend/backend origins. Do not place secrets in `NEXT_PUBLIC_` variables.

Email/password registration verifies the supplied address before activating the account; password reset uses a one-day signed link. Configure SMTP using the `EMAIL_*` settings in the backend environment. Google OAuth uses Django authorization code, PKCE, nonce, and Google ID-token verification. Production Google sign-in was verified end to end on 2026-11-16 after fixing the authorization-state mismatch. Existing Supabase Auth users and `public.profiles` records are left untouched; follow [AUTH_MIGRATION.md](AUTH_MIGRATION.md) for the staged account transition and password reset plan.

For local testing without an SMTP provider, set `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend` in `backend/.env`. Verification and password-reset links will print in the Django terminal; use them only in local development. For production, configure SMTP and use Django's SMTP email backend.

The backend sends password reset email using Django's configured email backend. Configure SMTP before using password reset outside development. The last supplied Supabase inventory found no Storage buckets. `seed_demo_campaigns --ensure-storage` provisions private `advertisements` (images only) and `documents` (PDF and images) buckets with a 10 MB cap when missing. Keep bucket access server-only through Django and the private service-role key; reads use short-lived signed URLs. Do not expose the key to the frontend.

Driver campaign APIs support available listings, applications, advertiser accept/reject, driver-owned participation lists, selecting the current accepted campaign, and starting/stopping an elapsed-hours timer. Campaign pause/end closes any open timer, clears the selected creative, and sends an in-app notification. Business campaign actions activate, pause, resume, and complete campaigns; activation requires an approved linked creative, dates, and at least one driver slot. Campaign participation, rates, hours, and impression fields are scoped and read by Django. Timer-based hours and pay remain **estimated**; no GPS, hardware broadcast verification, or real impression collector exists.

`supabase/schema.sql` documents the existing public lead/contact tables. Django maps those tables as unmanaged models and handles inserts through its API. `supabase/profiles.sql` is legacy Supabase Auth setup; do not use it to create new application accounts under the Django auth architecture.

## Current deployment

- Django API: `https://fleetcast-django-api.onrender.com` (health endpoint returns HTTP 200).
- Next.js Production: `https://fleetcast-website-pjcr.vercel.app`.
- Vercel Production variables are configured as `NEXT_PUBLIC_API_URL=/api/v1`, `DJANGO_API_ORIGIN=https://fleetcast-django-api.onrender.com`, and `DJANGO_API_URL=https://fleetcast-django-api.onrender.com/api/v1`. Browser API requests use the same-origin Vercel rewrite to preserve HttpOnly cookies.
- The Vercel API proxy health route has been verified through to Django/Gunicorn. Additive Django migrations have been applied to Supabase after read-only schema, Auth, and Storage inspection.

The GitHub deployment branch is `codex/render-deployment`. The Render Blueprint applies the additive `accounts.0003_userworkspace` membership migration and campaign/vehicle activity migrations during build. The account migration preserves existing role assignments and creates membership rows; it does not duplicate or alter users. Keep Google and Supabase credentials in private service environment settings, never in source control or `NEXT_PUBLIC_` variables.

Register `https://fleetcast-website-pjcr.vercel.app/api/v1/auth/google/callback/` as an authorized redirect URI for the `Local_web Fleetcast` Google OAuth client. This URI and the matching public client ID are configured in Google Cloud and Render. Keep the corresponding client secret private. The `oauth_state` fix is deployed and the additive state-table migration is applied; a real production Google sign-in reached the correct dashboard. The backend upload MIME fix and verified legacy-account transition are deployed; end-to-end upload still needs an authenticated test.

## Project structure

```
src/
  app/
    layout.tsx              fonts, global CSS, metadata
    (site)/layout.tsx       header + footer + pop-up
    (site)/page.tsx         home page
    (site)/contact/         contact page
    (site)/[...slug]/       placeholder pages for menu links
    login/, signup/         Django-backed auth screens
    api/contact, api/leads  Django API proxy
  components/               Header, Footer, VideoPlayer, GlobalMap, …
  components/home/          one file per home-page section
  content/site.ts           all copy, links and image paths
  lib/api/                  centralized Django API/auth clients
  lib/                      useInView, useAutoCycle, useSubmit
  lib/machines/             pure state machines + their tests
  styles/                   base, header, home, components, pages
supabase/schema.sql
```

`backend/` contains the modular Django REST Framework API, additive initial migrations for its new application tables, and a Render Blueprint. Those migrations have been applied to Supabase. Existing Google-linked Supabase users are transitioned just in time after a verified Google subject match and explicit Business/Driver selection; the legacy Auth rows remain intact.
