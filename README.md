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
- **Driver dashboard** (`/dashboard`): vehicles and verification counts come from Django; earnings and assigned advertisements are explicitly unavailable.
- **Admin dashboard** (`/dashboard/admin`): platform counts and approval queues are protected by Django role permissions.
- **Management pages**: `/dashboard/campaigns`, `/dashboard/advertisements`, `/dashboard/vehicles`, `/dashboard/payments`, `/dashboard/notifications`, and `/dashboard/profile`. Admin lists are under `/dashboard/admin/`.
- **Settings** (`/dashboard/settings`): updates the Django user profile and supports password changes.
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

Initial Django migrations now create only the new application tables (`accounts_user`, business/driver profiles, vehicles, advertisements, campaigns, payments, and notifications). They contain `CreateModel` operations only and have been verified on a fresh temporary SQLite database. They have **not** been applied to Supabase. The public-schema inventory does not inspect Supabase Auth or Storage. Run `python manage.py inspect_database` for public table structure and `python manage.py inspect_supabase` for auth/storage structure, aggregate legacy account counts, bucket metadata, and public RLS policies. Both commands are read-only and refuse the SQLite fallback; the second does not emit user emails or IDs.

Set up Google as a **Web application** OAuth client in [Google Cloud Console](https://console.cloud.google.com). Add the exact server callback URL from `GOOGLE_REDIRECT_URI` to Authorized redirect URIs (local default: `http://localhost:8000/api/v1/auth/google/callback/`). Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` only in Django's private `.env`. For production use HTTPS, `COOKIE_SECURE=True`, and the exact production frontend/backend origins. Do not place secrets in `NEXT_PUBLIC_` variables.

Email/password registration verifies the supplied address before activating the account; password reset uses a one-day signed link. Configure SMTP using the `EMAIL_*` settings in the backend environment. Google OAuth is implemented through Django with authorization code, state, PKCE, nonce, and Google ID-token verification. A real sign-in attempt returned `401 invalid_client`, so successful Google login is **not** verified. Existing Supabase Auth users and `public.profiles` records are left untouched; follow [AUTH_MIGRATION.md](AUTH_MIGRATION.md) for the staged account import and password reset plan.

For local testing without an SMTP provider, set `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend` in `backend/.env`. Verification and password-reset links will print in the Django terminal; use them only in local development. For production, configure SMTP and use Django's SMTP email backend.

The backend sends password reset email using Django's configured email backend. Configure SMTP before using password reset outside development. Create/configure private Supabase Storage buckets named by `SUPABASE_ADS_BUCKET` and `SUPABASE_DOCUMENTS_BUCKET`; the service-role key belongs only in Django's `.env`. Document storage access is returned through short-lived signed URLs.

`supabase/schema.sql` documents the existing public lead/contact tables. Django maps those tables as unmanaged models and handles inserts through its API. `supabase/profiles.sql` is legacy Supabase Auth setup; do not use it to create new application accounts under the Django auth architecture.

## Deploy the Django API to Render

The repository includes a `render.yaml` Blueprint for the Django API. It does not create a database or run migrations. Connect this GitHub repository in Render using **New → Blueprint**, review the `fleetcast-django-api` service, and provide the private environment values (especially the existing Supabase `DATABASE_URL`, Google client credentials, Supabase Storage key, and SMTP credentials) in Render. Do not paste secrets into GitHub or chat. The configured health check is `/api/v1/health/` and does not query the database.

After the service is created, run `python manage.py inspect_database` and `python manage.py inspect_supabase` from the Render Shell and review their metadata-only output. Do not apply migrations against Supabase until existing Auth identities, RLS, storage buckets, and account relationships have been reviewed and compatible mappings are planned. Render auto-deploy is disabled in the Blueprint so the service is deployed only after you configure it.

## Deploy the frontend to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel, choose **Add New → Project** and import the repo. The framework is detected as Next.js.
3. Set `NEXT_PUBLIC_API_URL` to `/api/v1`, `DJANGO_API_ORIGIN` to the Django service origin (for example `https://fleetcast-django-api.onrender.com`), and `DJANGO_API_URL` to that origin plus `/api/v1`. The Vercel rewrite proxies browser API traffic through the frontend origin for first-party HttpOnly cookies; server-side public form proxies use `DJANGO_API_URL` directly.
4. Set the Django environment values in Render, then deploy the frontend. Register `https://<your-vercel-domain>/api/v1/auth/google/callback/` as the Google OAuth authorized redirect URI and set Django's `FRONTEND_URL` to the same Vercel origin. The Blueprint currently uses `https://fleetcast-website-pjcr.vercel.app`; update it if your production alias differs.

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

`backend/` contains the modular Django REST Framework API, create-only initial migrations for its new application tables, and a Render Blueprint. Supabase migrations remain unapplied pending inspection of the existing `auth`/`storage` schemas and review of legacy accounts.
