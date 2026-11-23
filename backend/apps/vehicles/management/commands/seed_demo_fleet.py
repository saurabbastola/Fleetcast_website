from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.accounts.models import User
from apps.drivers.models import DriverProfile
from apps.vehicles.models import Vehicle


class Command(BaseCommand):
    help = "Create a clearly marked, idempotent demo vehicle and sample campaign history for an existing Driver workspace."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True, help="Exact email of the existing Fleet Owner / Driver account.")
        parser.add_argument("--with-assets", action="store_true", help="Try uploading the repository sample creatives to configured Supabase Storage.")

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.DEBUG or not settings.FLEETCAST_DEMO_MODE:
            raise CommandError("Demo fleet seeding is disabled. Set DEBUG=True and FLEETCAST_DEMO_MODE=True only in your development environment.")
        email = options["email"].strip().lower()
        user = User.objects.filter(email__iexact=email, workspaces__role=User.Role.DRIVER).distinct().first()
        if user is None:
            raise CommandError("No existing account with this email and a Driver workspace was found. Register through the frontend first; no account was created.")
        if email == settings.DEVELOPER_EMAIL and (not user.is_active or not user.email_verified):
            # Explicitly authorized dev-only verification for the named test
            # account; registration must still establish its password first.
            user.is_active = True
            user.email_verified = True
            user.save(update_fields=["is_active", "email_verified", "updated_at"])
        elif not user.is_active or not user.email_verified:
            raise CommandError("The account must complete the normal email verification flow before demo seeding.")

        DriverProfile.objects.get_or_create(user=user)
        registration_number = f"DEMO-{user.pk.hex[:8].upper()}"
        existing = Vehicle.objects.filter(registration_number=registration_number).first()
        if existing and (existing.driver_id != user.id or not existing.is_demo):
            raise CommandError("The reserved demo registration number belongs to a non-demo or different-owner record. No vehicle was changed.")
        vehicle, created = Vehicle.objects.get_or_create(
            registration_number=registration_number,
            defaults={
                "driver": user,
                "vehicle_model": "Fleetcast Demo Sedan",
                "vehicle_type": "Car",
                "status": Vehicle.Status.APPROVED,
                "is_demo": True,
            },
        )
        if not created and vehicle.driver_id == user.id and vehicle.is_demo:
            vehicle.vehicle_model = "Fleetcast Demo Sedan"
            vehicle.vehicle_type = "Car"
            vehicle.status = Vehicle.Status.APPROVED
            vehicle.save(update_fields=["vehicle_model", "vehicle_type", "status", "updated_at"])

        seed_options = {"driver_email": email, "verbosity": 0}
        if not options["with_assets"]:
            seed_options["skip_assets"] = True
        call_command("seed_demo_campaigns", **seed_options)
        self.stdout.write(self.style.SUCCESS(
            f"Demo fleet ready for existing Driver workspace: vehicle {vehicle.registration_number} ({vehicle.get_status_display()}); demo campaign sessions are linked to it."
        ))
