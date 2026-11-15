# Google Authentication Audit

Audit date: 2026-11-12

## Previous implementation before Django integration

The prior frontend used Supabase Auth for email/password, Google OAuth, signup/reset, and session state. Its shared OAuth helper returned to `/auth/callback` after Supabase issued a session.

The README's provider callback URI is `https://<project-ref>.supabase.co/auth/v1/callback`. Supabase then redirects the browser to the configured frontend callback, currently `/auth/callback?next=...`. These are two different redirect stages.

## Why the current architecture does not meet the target

Even if the Supabase Google flow is configured correctly, it creates a Supabase Auth session. It does not ask Django to verify the Google identity, resolve the Django `User` and role, or issue Django application JWTs. The same Supabase authority currently handles password login, signup, reset, profile metadata, and app session state. It must be replaced as the source of new application sessions when the Django flow is ready.

## Failure diagnosis status for the old flow

The source code has error parsing for redirect query/hash parameters, a preflight check for Google provider enablement, and user-facing handling for some provider/database/cancellation errors. This confirms likely diagnostic paths, but it does not identify which failure occurred in the user's deployed setup.

The workspace contains no verified Google client configuration or accessible Supabase Auth provider settings. The local `.env.local` is ignored; only variable names were inspected. No credentials or credential values were copied into this document. No browser console/network trace or completed test OAuth flow was available. Therefore the reported Google login failure's exact operational cause remains undetermined. The architectural mismatch is confirmed: the prior flow returned a Supabase session where the selected architecture requires Django JWT.

- Google client ID/secret mismatch or disabled Google provider in Supabase.
- Incorrect Google authorized redirect URI (must match the Supabase callback for the current flow).
- Supabase redirect allow-list / Site URL mismatch for the frontend callback.
- Missing or stale frontend environment values between local and deployed environments.
- Provider callback success followed by user/profile creation failure.
- Callback route, session exchange, or browser session persistence failure.

Do not claim the existing flow works until tested with real configured credentials and a completed browser sign-in.

## Environment references found

The previous frontend template contained `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_AFTER_LOGIN_URL`. It has been replaced with a template containing only `NEXT_PUBLIC_API_URL`. Django's `backend/.env.example` now documents `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `FRONTEND_URL`, and `BACKEND_URL`. Never expose a Google client secret in a `NEXT_PUBLIC_` variable.

## Django flow implemented

The backend stores state, nonce, verifier, and selected Business/Driver role in the Django session; performs authorization-code OAuth with S256 PKCE; checks state and nonce; verifies Google's ID token; requires verified email; refuses email-only account linking; and sets Django JWT cookies. The frontend callback resolves the Django profile and routes by role. This follows the [Authlib OAuth2 client documentation](https://docs.authlib.org/en/stable/oauth2/client/http/index.html).

The local backend `.env` now contains Google credentials and a Supabase connection URI, but those values are ignored and were not copied into this audit. A browser attempt returned `401 invalid_client` / “OAuth client was not found”; the credential/client setup is therefore still failing. No successful Google sign-in or callback is verified. For the Vercel same-origin API proxy, register the production callback from `GOOGLE_REDIRECT_URI`, currently planned as `https://fleetcast-website-pjcr.vercel.app/api/v1/auth/google/callback/`.

## Recommended Django-authoritative flow

Use a maintained OAuth/OIDC client on Django for authorization-code flow with state validation and PKCE where supported. Django should validate the provider response and verified email, resolve/link a local account only under explicit safe rules, apply account-active and role checks, then establish the Django JWT session through secure HttpOnly cookies or a one-time, short-lived, single-use handoff. New Google users must select Business or Driver through a controlled registration process; Google identity must never grant ADMIN. Do not link an existing account solely because a Google email string matches unless identity verification and account-linking policy makes that safe.

The frontend now initiates Django's OAuth endpoint and then consumes the Django session. It does not receive or persist long-lived provider secrets or a Supabase Auth session for new application logins. Existing Supabase Auth users and profile rows have not been deleted or modified. The account migration and password-reset plan is documented in [AUTH_MIGRATION.md](./AUTH_MIGRATION.md); migration should be rehearsed before any production cutover.

## Required configuration and verification

For the Django flow, set server-side `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `FRONTEND_URL`, and `BACKEND_URL` in the ignored backend `.env`. Register the exact Django callback URI with Google Cloud Console. Configure trusted origins/CORS and cookie settings for local and preview environments without broad wildcards in production. Keep secrets out of Git and frontend variables.

Before enabling production login, verify with real credentials: new Business signup, new Driver signup, existing linked account behavior, unlinked existing-account behavior, state mismatch/replay rejection, inactive account rejection, cancellation/error return, role-correct redirect, JWT refresh, logout/revocation, and cookie security. Test against a non-production environment first.
