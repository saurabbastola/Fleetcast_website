"""Read-only inventory of tables, columns, indexes, and constraints; never reads row data."""
import json
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction


def safe_connection_hint(exc):
    """Return a troubleshooting category without echoing a DSN or raw error."""
    messages = []
    current = exc
    while current is not None:
        messages.append(str(current).lower())
        current = current.__cause__
    message = " ".join(messages)
    if any(s in message for s in ("could not translate host name", "nodename nor servname", "name or service not known", "temporary failure in name resolution")):
        return "DNS could not resolve the database host; verify the exact Session pooler host in Supabase Connect and check network/DNS access."
    if any(s in message for s in ("password authentication failed", "scram authentication failed", "tenant or user not found", "invalid password")):
        return "Supabase rejected database authentication; verify the Session pooler username and database password."
    if any(s in message for s in ("certificate verify failed", "ssl error", "tls error", "sslmode")):
        return "TLS negotiation failed; verify the connection URI's SSL settings."
    if any(s in message for s in ("timed out", "timeout expired")):
        return "The database connection timed out; check Supabase network restrictions and connectivity."
    if any(s in message for s in ("connection refused", "no route to host", "network is unreachable")):
        return "The database host refused or is unreachable from this network; check its host, port, and network restrictions."
    if "does not exist" in message and ("database" in message or "role" in message):
        return "The database or role was not found; use the exact database name and pooler username from Supabase Connect."
    return "Check the exact Session pooler host, port, username, database name, and password in Supabase Connect; raw connection details are intentionally hidden."


class Command(BaseCommand):
    help = "Print existing database structure without changing or reading application rows."
    def handle(self, *args, **options):
        if not settings.DATABASE_URL:
            raise CommandError("DATABASE_URL is not configured. Refusing to inspect the local SQLite fallback.")
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    if connection.vendor == "postgresql": cursor.execute("SET TRANSACTION READ ONLY")
                    elif connection.vendor == "sqlite": cursor.execute("PRAGMA query_only = ON")
                    tables = connection.introspection.table_names(cursor)
                    result = []
                    for table in tables:
                        description = connection.introspection.get_table_description(cursor, table)
                        constraints = connection.introspection.get_constraints(cursor, table)
                        primary_key_columns = {
                            column
                            for constraint in constraints.values()
                            if constraint.get("primary_key")
                            for column in constraint.get("columns", [])
                        }
                        result.append({
                            "table": table,
                            "columns": [
                                {
                                    "name": column.name,
                                    "type": str(column.type_code),
                                    "nullable": column.null_ok,
                                    "primary_key": column.name in primary_key_columns,
                                }
                                for column in description
                            ],
                            "constraints": [
                                {
                                    "name": name,
                                    "type": "unique" if item.get("unique") else "index" if item.get("index") else "foreign_key" if item.get("foreign_key") else "check" if item.get("check") else "primary_key" if item.get("primary_key") else "constraint",
                                }
                                for name, item in constraints.items()
                            ],
                        })
                    self.stdout.write(json.dumps(result, indent=2, default=str))
                transaction.set_rollback(True)
        except Exception as exc:
            hint = safe_connection_hint(exc)
            raise CommandError(f"Read-only database inspection failed ({exc.__class__.__name__}). {hint} No application rows were read and no changes were made.") from exc
