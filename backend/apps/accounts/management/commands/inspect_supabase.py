"""Read-only summary of Supabase Auth, Storage, and RLS metadata; never emits user rows."""
import json

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction

from .inspect_database import safe_connection_hint


class Command(BaseCommand):
    help = "Summarize Supabase auth/storage schema and public RLS metadata without exposing user records."

    def handle(self, *args, **options):
        if not settings.DATABASE_URL:
            raise CommandError("DATABASE_URL is not configured. Refusing to inspect the local SQLite fallback.")
        if connection.vendor != "postgresql":
            raise CommandError("This command requires PostgreSQL; no database was modified.")

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute("SET TRANSACTION READ ONLY")
                    cursor.execute(
                        """
                        SELECT table_schema, table_name, column_name, data_type, is_nullable
                        FROM information_schema.columns
                        WHERE (table_schema = 'auth' AND table_name IN ('users', 'identities'))
                           OR (table_schema = 'storage' AND table_name = 'buckets')
                        ORDER BY table_schema, table_name, ordinal_position
                        """
                    )
                    auth_storage_columns = [
                        {"schema": r[0], "table": r[1], "column": r[2], "type": r[3], "nullable": r[4] == "YES"}
                        for r in cursor.fetchall()
                    ]

                    cursor.execute("SELECT to_regclass('auth.users'), to_regclass('auth.identities'), to_regclass('storage.buckets')")
                    auth_users_table, identities_table, buckets_table = cursor.fetchone()

                    user_count = None
                    if auth_users_table:
                        cursor.execute("SELECT COUNT(*) FROM auth.users")
                        user_count = cursor.fetchone()[0]

                    identity_providers = []
                    if identities_table:
                        cursor.execute("SELECT provider, COUNT(*) FROM auth.identities GROUP BY provider ORDER BY provider")
                        identity_providers = [{"provider": row[0], "count": row[1]} for row in cursor.fetchall()]

                    buckets = []
                    if buckets_table:
                        cursor.execute("SELECT id, name, public FROM storage.buckets ORDER BY name")
                        buckets = [{"id": row[0], "name": row[1], "public": row[2]} for row in cursor.fetchall()]

                    cursor.execute(
                        """
                        SELECT tablename, policyname, roles, cmd, qual, with_check
                        FROM pg_policies
                        WHERE schemaname = 'public'
                        ORDER BY tablename, policyname
                        """
                    )
                    policies = [
                        {"table": r[0], "name": r[1], "roles": r[2], "command": r[3], "using": r[4], "check": r[5]}
                        for r in cursor.fetchall()
                    ]

                    self.stdout.write(json.dumps({
                        "auth_storage_columns": auth_storage_columns,
                        "auth_user_count": user_count,
                        "identity_provider_counts": identity_providers,
                        "storage_buckets": buckets,
                        "public_rls_policies": policies,
                    }, indent=2, default=str))
                transaction.set_rollback(True)
        except Exception as exc:
            raise CommandError(
                f"Supabase Auth/Storage inspection failed ({exc.__class__.__name__}). "
                f"{safe_connection_hint(exc)} No application rows or emails were emitted, and no changes were made."
            ) from exc
