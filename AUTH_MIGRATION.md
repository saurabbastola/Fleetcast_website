# Supabase Auth to Django account migration plan

This is a non-destructive migration plan. No Supabase Auth users, identities, profiles, tables, or passwords are deleted or altered by the current code.

## Before importing accounts

1. Configure a read-only Supabase PostgreSQL connection and run `cd backend && python manage.py inspect_database`. Review `auth.users`, `auth.identities`, `public.profiles`, existing business/driver tables, their constraints, RLS policies, and counts without exporting row contents to logs.
2. Back up the project and test against a protected staging copy. Restrict any account export to authorized operators and store it encrypted. Do not place email addresses, provider tokens, or password hashes in repository files or logs.
3. Confirm the legacy identity mapping. `profiles.portal` values `ads` and `fleet` may be candidates for BUSINESS and DRIVER. Do not automatically map unknown portals or grant ADMIN based on Supabase metadata. Resolve unknown roles manually.
4. Map each imported Supabase UUID into Django's `legacy_supabase_user_id`. Map verified Google provider subjects from `auth.identities` into `provider_subject` only after checking identity/provider ownership. Never merge accounts based only on matching email strings.

### Current inventory (read-only, 2026-11-15)

The hosted project has 3 rows in `auth.users` and 4 provider identity rows: 1 `email` and 3 `google`. These are provider-identity counts, not distinct users per provider; the aggregate output does not show whether an account has multiple providers or how identities map to `public.profiles`. Do not infer import/link decisions from these totals. There are no existing Storage buckets. The public `profiles` table is linked to `auth.users` and has own-row SELECT/UPDATE RLS policies; existing Auth users and profile rows were not modified.

## Passwords and verification

- Preserve `auth.users` and the existing Supabase Auth login path during the migration window. Do not assume Supabase password hashes are directly compatible with Django's configured hashers; verify format and compatibility in staging before any import.
- When safe password-hash migration cannot be confirmed, import the account as inactive and send the owner through Django's password-reset/verification flow. The current public registration flow also requires email verification before password login.
- Existing Supabase users remain untouched until the import is reviewed. After a verified identity is linked, new sessions are issued by Django. Existing Supabase sessions expire under their existing policy; they are not revoked by this frontend change.
- Google users should be matched by a verified provider subject. If that mapping cannot be proven, require the user to sign in to the legacy account and complete a verified account-linking flow; the current Google callback rejects email-only linking.

## Cutover and rollback

1. Import accounts and role profiles in a transaction on staging. Compare account/profile counts and resolve duplicate emails/identities before enabling login.
2. Test password login/reset, Google login, role guards, profile ownership, and business/driver data access. Verify at least one account from every supported role.
3. Set `email_verified` only from verified legacy data (`auth.users.email_confirmed_at` or equivalent); do not infer it from a non-empty email.
4. After review, deploy Django as the application auth authority. Keep Supabase Auth records and legacy identifiers available throughout the rollback window.
5. If rollback is needed, deploy the previously approved frontend/backend release and keep both account stores intact. Do not delete or overwrite Supabase Auth users as part of rollback.

Any migration that changes or removes existing Supabase Auth users, tables, policies, or records requires a separate reviewed and explicitly approved operation.
