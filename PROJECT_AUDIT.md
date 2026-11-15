# Fleetcast Project Audit

Audit date: 2026-11-12

## Scope and constraints

This audit inspected the local workspace source, route files, configuration references, and SQL files. Integration work followed the audit. It did not connect to Supabase or change database state. The hosted Supabase schema, data, Auth users, Storage buckets, and policies remain unverified. Do not create or apply domain migrations until those are inspected read-only.

At audit time the working tree contained user changes to README and auth files. They were inspected and then incorporated into the Django auth integration rather than discarded.

## Existing frontend structure before integration

- Framework: Next.js 16 with the **App Router**, under `src/app/`.
- Language: TypeScript and TSX (`tsconfig.json` enables strict mode).
- Styling: plain CSS in `src/styles/`; no Tailwind or component library is configured.
- Client libraries: React 19, D3 Geo, and TopoJSON. The former Supabase Auth SDK was removed from the frontend. Axios is not installed; the centralized `src/lib/api/client.ts` uses Fetch.
- Static media: `public/images/` and `public/video/`.
- Integration work added a separate Django backend, frontend API/auth clients, domain data screens, and API-driven dashboard components.

## Existing routes

| Route | Current purpose |
| --- | --- |
| `/` | Marketing home page; `HomeGate` redirects signed-in visitors to `/dashboard`. |
| `/contact` | Contact form. |
| `/[...slug]` | Generated placeholder pages for marketing navigation destinations. |
| `/login` | Login UI and direct Supabase Auth login / Google OAuth. |
| `/signup` | Signup UI and direct Supabase Auth registration / Google OAuth. |
| `/auth/callback` | Client-side Supabase OAuth callback handling. |
| `/dashboard` | Single advertiser-style dashboard, guarded using the Supabase session. |
| `/dashboard/settings` | Supabase user/profile name editing and sign-out. |
| `/api/contact` | Next.js route handler inserts a contact form submission into Supabase. |
| `/api/leads` | Next.js route handler inserts a playbook lead into Supabase. |
| not-found | Shared 404 route. |

The dashboard sidebar displays Campaigns, Fleet, Creative Studio, and Analytics as unavailable “Soon” links. There are no separate Business, Driver, or Admin pages or role-based navigation/routes yet. Current login/signup portals should be mapped before changing their labels or destinations; `src/lib/portals.ts` contains the existing portal vocabulary.

## Existing user interfaces and reusable components

- **App/site shell:** `src/app/layout.tsx`, `src/app/(site)/layout.tsx`, `Header`, `Footer`, `PlaybookPopup`.
- **Marketing home sections:** `src/components/home/` contains `LandingPage`, `HomeGate`, `Hero`, `Marketplace`, `Formats`, `Stages`, `WrapsQr`, `Studio`, `GlobalReach`, `Testimonials`, `TrustedBy`, `CaseStudies`, `Attention`, `Goal`, and `ContactCta`.
- **Forms and overlays:** `ContactForm`, `LeadModal`, `PlaybookCover`, `PlaybookPopup`, `LoginCard`, `SignupCard`, and shared auth UI in `components/auth/AuthUi.tsx`.
- **Account/dashboard:** `AccountMenu`, `DashboardShell`, `AccountBar`, `DashboardView`, and `SettingsView`.
- **Visual/interaction utilities:** `Logo`, `Reveal`, `BubbleConnector`, `VideoPlayer`, `GlobalMap`, `Vehicles`.
- **Stylesheets:** `base.css`, `components.css`, `header.css`, `pages.css`, `hero.css`, `dashboard.css`, `moving.css`, and `home.css`.

The landing page contains substantial existing product copy, images, illustrations, and navigation content. Preserve these assets and written content during API integration and any approved visual redesign. Several marketing sections explicitly describe sample/example content; do not treat those examples as live business data.

## Mock, placeholder, and static data locations

- `src/content/dashboard.ts`: sample dashboard metrics (impressions, scans, active vehicles, scan rate), campaign rows, fleet mix, and top streets.
- `src/components/dashboard/DashboardView.tsx`: renders those values as if they were a reporting dashboard; a “Sample data” label is shown, but figures must be removed from live reporting views when API integration begins unless explicitly retained as clearly labeled demo content.
- `src/content/site.ts`: intentionally static marketing copy and display examples, including marketplace sample matches, format statistics, testimonials marked placeholder, trusted-by/logo display content, and campaign illustrations. These are marketing content, not authenticated records.
- `src/components/Vehicles.tsx`: illustrative vehicle SVGs used in marketing UI.
- `src/components/home/Marketplace.tsx`, `WrapsQr.tsx`, `Stages.tsx`, `Testimonials.tsx`, `TrustedBy.tsx`: static/cycling illustrative examples and placeholders.
- `src/app/(site)/[...slug]/page.tsx`: placeholder route content for menu links, not missing API data.
- `src/app/api/contact/route.ts` and `src/app/api/leads/route.ts`: log submitted form data when Supabase is not configured; otherwise insert into Supabase using the public key.

Before integration there were no vehicle, advertisement, business, payment, notification, or driver API data files. The old `src/content/dashboard.ts` sample arrays have been removed.

## Existing Supabase integrations

- `src/lib/supabase.ts` constructs browser and server Supabase clients from `NEXT_PUBLIC_SUPABASE_URL` plus the anon/publishable key.
- `src/lib/auth.tsx` uses `supabase.auth.getSession`, `onAuthStateChange`, and `signOut` as the app-wide session source.
- `LoginCard` calls Supabase password login, password reset, and Google OAuth helpers.
- `SignupCard` creates Supabase Auth users, verifies email OTP, resends codes, and initiates Google OAuth.
- `SettingsView` updates Supabase Auth metadata and `public.profiles` directly from the browser.
- Next.js `/api/contact` and `/api/leads` write to Supabase directly; these are lead-capture operations, not domain CRUD.
- `supabase/schema.sql` defines `contact_submissions` and `playbook_leads`, with insert policies for anon/authenticated.
- `supabase/profiles.sql` defines `public.profiles` keyed to `auth.users(id)`, a signup trigger, and own-profile read/update policies.

The SQL artifacts are not a full inventory of the hosted database. In particular, they do not establish whether other business tables already exist. The `profiles` foreign key to `auth.users` also means a Django custom-user migration needs a deliberate coexistence/migration plan; do not rename, drop, or replace Supabase Auth tables or existing records as part of initial setup.

## Authentication and OAuth findings

- The active frontend authentication authority is currently Supabase Auth, not Django. This is true for email/password, Google sign-in, signup, reset, app session state, and sign-out.
- Google sign-in is initiated by `startGoogle()` in `src/components/auth/AuthUi.tsx`, which calls Supabase `signInWithOAuth({ provider: "google" })` and returns to `/auth/callback`.
- The project README documents Google Cloud's authorized redirect URI as the Supabase callback `https://<project-ref>.supabase.co/auth/v1/callback`. The frontend callback is separate and is supplied as Supabase's post-auth redirect.
- The callback component waits for a Supabase browser session and then redirects to a safe same-site `next` path. It parses URL errors and maps some Supabase/Google failures to user-facing messages.
- Current code also checks Supabase's provider settings endpoint for a disabled Google provider. It maps selected OAuth errors (provider verification, database user creation, cancellation) but does not provide evidence of a real browser sign-in having succeeded or failed.
- Configuration references in source and `.env.example` are `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable key), and `NEXT_PUBLIC_AFTER_LOGIN_URL`. The `.env.example` values are placeholders. The local `.env.local` file is ignored; only its variable names were inspected, not its values. No Google client ID/secret, Django API URL, or Django OAuth settings are documented in the frontend template.
- Google Cloud Console and Supabase-hosted provider settings cannot be inspected from this source workspace. There is no observed browser error log or verified OAuth run available here. Therefore the precise operational cause of the reported Google failure is **not yet established**. Plausible code/configuration failure points include provider enablement/client credentials, Supabase callback and allowed redirect configuration, environment mismatch, and callback/session completion; they require a real configured flow to distinguish.
- For the chosen architecture, Google OAuth must move behind Django. Supabase Auth must not issue new application sessions once that migration is implemented. Preserve existing Supabase Auth accounts until an explicit account migration and reset/linking process is agreed and tested.

See [GOOGLE_AUTH_AUDIT.md](GOOGLE_AUTH_AUDIT.md) for the focused findings and migration plan.

## Components that needed API integration

1. **Central session/API foundation:** `src/lib/auth.tsx`, auth components, root provider, `DashboardShell`; add Django-backed session handling, API client, token refresh/error handling, and server/client route guard strategy.
2. **Business account:** login/signup role selection, business profile, dashboard, campaign list/detail/forms, advertisements/creative upload, payment history, notifications.
3. **Driver account:** role-specific registration/profile, vehicle list/detail/registration/document uploads, verification state, notifications, and earnings page with unavailable metrics clearly identified.
4. **Admin account:** protected user/business/driver/vehicle/ad/campaign review lists and approval actions; no admin UI currently exists.
5. **Shared form/error patterns:** existing auth/contact/settings state machines and form components should be adapted where useful; preserve current visual components and form meaning.
6. **Lead capture:** decide whether Django should own contact/playbook submissions too. The current Next.js handlers write directly to Supabase; this is outside the requested domain CRUD but is an existing database bypass that should be resolved consistently.
7. **Marketing display examples:** keep static illustrative content distinct from logged-in records and label any demo examples clearly; never present sample analytics as real results.

## Integration status and remaining sequence

### Supabase inventory update (2026-11-15)

The read-only public-schema inventory found `contact_submissions`, `playbook_leads`, and `profiles`. It found no existing public tables for the Django business/driver/vehicle/advertisement/campaign/payment/notification models. `profiles.id` has a foreign key to `auth.users`; these legacy tables are not mapped for writes and migrations do not alter them. The two lead tables are represented by unmanaged Django models.

Create-only initial migrations were generated for the new Django app tables and successfully applied to a fresh temporary SQLite database. After the Supabase inventories confirmed there were no existing domain tables, the additive migrations were applied to Supabase successfully. The existing local `development.sqlite3` has an older built-in migration history and is not suitable for validating the new custom-user initial migration; it was left unchanged. Use a fresh local database for that validation.

The public inventory does not include the `auth` or `storage` schemas. The new read-only `inspect_supabase` management command reports Auth/Storage column metadata, aggregate Auth user/provider counts, bucket metadata, and public RLS policy metadata without emitting user rows. Run it from a network that can reach Supabase before account migration or deployment cutover.

The follow-up read-only Auth/Storage inventory was completed on 2026-11-15. It reports 3 confirmed Supabase Auth users, all 3 with distinct Google identities, and 1 of those accounts also has an email identity. Two `public.profiles` rows link to Auth users, both with NULL `portal`; the third Auth user has no profile row. The existing `public.profiles` foreign key to `auth.users` and own-row SELECT/UPDATE policies remain relevant; the lead tables have public INSERT policies. The additive Django migrations created new application/framework tables only; no Auth users, profiles, lead rows, RLS policies, or existing tables were modified. A verified Google subject bridge now imports legacy accounts just in time, asks the user to select Business or Driver, and records the legacy UUID. That code is not deployed until the Render service is updated.

The Storage buckets `advertisements` and `documents` were created as private buckets with 10 MB limits and MIME restrictions matching the Django upload validator. No client RLS policies were added; Django uses its server-only service-role key for object writes and signed reads. The `store_upload` content-type bug was fixed, covered by a backend test, and deployed to Render. End-to-end upload still needs an authenticated account and a successful real file upload.

### Deployment status

- Render API is live at `https://fleetcast-django-api.onrender.com`; `/api/v1/health/` returns HTTP 200.
- Additive Django migrations have been applied to the existing Supabase database; `showmigrations` confirms all applied and `manage.py check` passes.
- Vercel Production is deployed at `https://fleetcast-website-pjcr.vercel.app` with Django API environment configuration. The production `/api/v1/health/` proxy returns HTTP 200 from Gunicorn.
- Frontend typecheck and 33 tests pass; production build passes when Google Fonts can be fetched. Django tests previously passed (11) against isolated SQLite.
- The live Google OAuth client ID is not listed in the connected Google Cloud project; production callback URI is missing on the existing `Local_web Fleetcast` client. Render credentials and Google callback need updating, then Google login must be tested.
- The secure legacy-account bridge and storage upload fix are deployed. Authenticated upload/CRUD workflows remain to be tested.

## Remaining manual setup

- Update the Render Google client ID/secret using the existing Web OAuth client, add the exact production callback URI, and complete a real sign-in.
- Existing Supabase Auth users and `public.profiles` remain untouched until each account completes the verified Google transition. If email/password access is needed, use Django password reset after import; configure SMTP first.
- Test an authenticated upload. The buckets are private and service-role-only by design.
