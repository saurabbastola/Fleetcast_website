# Supabase Auth to Django account migration plan

This is a non-destructive migration plan. No Supabase Auth users, identities, profiles, tables, or passwords are deleted or altered by the current code.

## Before importing accounts

1. Configure a read-only Supabase PostgreSQL connection and run `cd backend && python manage.py inspect_database`. Review `auth.users`, `auth.identities`, `public.profiles`, existing business/driver tables, their constraints, RLS policies, and counts without exporting row contents to logs.
2. Back up the project and test against a protected staging copy. Restrict any account export to authorized operators and store it encrypted. Do not place email addresses, provider tokens, or password hashes in repository files or logs.
3. Confirm the legacy identity mapping. `profiles.portal` values `ads` and `fleet` may be candidates for BUSINESS and DRIVER. Do not automatically map unknown portals or grant ADMIN based on Supabase metadata. Resolve unknown roles manually.
4. Map each imported Supabase UUID into Django's `legacy_supabase_user_id`. Map verified Google provider subjects from `auth.identities` into `provider_subject` only after checking identity/provider ownership. Never merge accounts based only on matching email strings.

### Current inventory (read-only, 2026-11-15)

The hosted project has 3 rows in `auth.users`, all 3 email-confirmed. All 3 have distinct Google identities, and 1 also has an email identity. Two `public.profiles` rows link to Auth users, but both have a NULL `portal`; the third Auth user has no profile row. Therefore no role can safely be inferred from the old profile data. There were no pre-existing Storage buckets. The public `profiles` table is linked to `auth.users` and has own-row SELECT/UPDATE RLS policies; existing Auth users and profile rows were not modified.

### Safe Google account transition

The Django Google callback now has a just-in-time transition for legacy accounts. After Google verifies the ID token and email, Django matches the exact Google `sub` to `auth.identities.provider_id`, then requires the linked Supabase account to be confirmed, active, and have the same email. The user must select Business or Driver in the existing role-selection flow; ADMIN is never an option. Django records the legacy UUID in `legacy_supabase_user_id`, links the verified subject, and creates the matching role profile in its own tables. It never imports or copies the Supabase password hash, and it leaves Supabase Auth/profile rows intact.

Because the deployed Google client currently fails with `invalid_client`, this transition has not run for any user. Once Google is correctly configured and the updated Django service is deployed, each of these users can sign in with their already-linked Google identity and select the correct role. If a user lacks a matching verified Google identity, do not create a duplicate based on email alone; handle that account separately with an operator-reviewed role and a Django password reset. Existing email credentials are not portable; the one legacy email identity also belongs to a Google-linked account, and reset remains available after import if Django SMTP is configured.

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
