from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
import json

from django.contrib.auth import get_user_model
from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.businesses.models import BusinessProfile
from apps.advertisements.models import Advertisement
from apps.drivers.models import DriverProfile
from apps.campaigns.models import BroadcastSession, Campaign, CampaignParticipation
from apps.vehicles.models import Vehicle


DEMO_CAMPAIGNS = [
    {"key":"northside-kitchen", "company":"DEMO — Northside Kitchen", "name":"DEMO · Northside Kitchen Seasonal Menu", "industry":"Food & Restaurants", "type":"Vehicle wrap", "image":"menu-retail.jpg", "description":"A sample local restaurant promotion for seasonal dishes and neighborhood lunch offers.", "areas":["Washington, DC", "Silver Spring, MD"], "days":-5, "length":30, "status":"ACTIVE", "slots":6, "hours":"60", "impressions":45000, "rate":"18.00", "duration":15, "requirements":"Keep the vehicle clean and the campaign wrap unobstructed.", "eligibility":"Cars, taxis, and rideshare vehicles operating in the service area."},
    {"key":"metro-bites", "company":"DEMO — Metro Bites", "name":"DEMO · Metro Bites New Location", "industry":"Food & Restaurants", "type":"Door and window graphics", "image":"owners-street.jpg", "description":"A demonstration launch campaign promoting a new neighborhood restaurant location.", "areas":["Arlington, VA", "Washington, DC"], "days":-2, "length":25, "status":"ACTIVE", "slots":4, "hours":"50", "impressions":32000, "rate":"16.50", "duration":10, "requirements":"Display campaign graphics during normal vehicle operation.", "eligibility":"Passenger vehicles and taxis in approved service areas."},
    {"key":"pocket-tech", "company":"DEMO — Pocket Tech", "name":"DEMO · Pocket Tech Device Launch", "industry":"Technology", "type":"Digital roof display", "image":"epaper-module.jpg", "description":"A clearly labeled demo electronics campaign featuring a fictional device launch.", "areas":["Washington, DC", "Baltimore, MD"], "days":-7, "length":40, "status":"ACTIVE", "slots":8, "hours":"80", "impressions":68000, "rate":"22.00", "duration":10, "requirements":"Digital display brightness must remain within local regulations.", "eligibility":"Vehicles fitted with an approved digital roof display."},
    {"key":"everyday-market", "company":"DEMO — Everyday Market", "name":"DEMO · Everyday Market Seasonal Savings", "industry":"Retail & Supermarkets", "type":"Full vehicle wrap", "image":"city-fleet.jpg", "description":"A sample supermarket seasonal savings promotion for an urban fleet.", "areas":["Washington, DC", "Alexandria, VA"], "days":-10, "length":35, "status":"ACTIVE", "slots":10, "hours":"70", "impressions":74000, "rate":"19.00", "duration":15, "requirements":"Use approved graphics and keep all required vehicle lights visible.", "eligibility":"Cars and vans with clean, unobstructed exterior panels."},
    {"key":"learn-forward", "company":"DEMO — Learn Forward", "name":"DEMO · Learn Forward Online Courses", "industry":"Education", "type":"Partial vehicle wrap", "image":"audience-crosswalk.jpg", "description":"A fictional online learning service advertising its introductory course catalog.", "areas":["Washington, DC", "College Park, MD"], "days":-1, "length":45, "status":"ACTIVE", "slots":5, "hours":"65", "impressions":38000, "rate":"17.00", "duration":12, "requirements":"Keep the campaign creative installed for the agreed participation period.", "eligibility":"Cars, taxis, and small vans in listed areas."},
    {"key":"capital-auto", "company":"DEMO — Capital Auto Group", "name":"DEMO · Capital Auto Test Drive Week", "industry":"Automotive", "type":"Rear-window graphic", "image":"fleet-vans.jpg", "description":"A sample dealership test-drive event announcement with no real offer attached.", "areas":["Washington, DC", "Bethesda, MD"], "days":-4, "length":21, "status":"ACTIVE", "slots":5, "hours":"42", "impressions":28000, "rate":"20.00", "duration":10, "requirements":"Rear-window materials must preserve driver visibility.", "eligibility":"Vehicles with compliant rear-window advertising placement."},
    {"key":"community-health", "company":"DEMO — Community Health Network", "name":"DEMO · Community Health Wellness Week", "industry":"Healthcare", "type":"Door decals", "image":"owners-portrait.jpg", "description":"A fictional community wellness awareness campaign for demonstration purposes.", "areas":["Washington, DC", "Prince George's County, MD"], "days":-3, "length":28, "status":"ACTIVE", "slots":7, "hours":"56", "impressions":41000, "rate":"18.50", "duration":10, "requirements":"Use only the provided awareness creative; do not add medical claims.", "eligibility":"Passenger vehicles used regularly in the listed communities."},
    {"key":"screen-night", "company":"DEMO — Screen Night Events", "name":"DEMO · Screen Night Community Festival", "industry":"Entertainment & Events", "type":"Vehicle wrap", "image":"hero-city.jpg", "description":"A fictional community film-night promotion and event awareness campaign.", "areas":["Washington, DC", "Hyattsville, MD"], "days":-6, "length":18, "status":"ACTIVE", "slots":6, "hours":"36", "impressions":30000, "rate":"19.50", "duration":15, "requirements":"Campaign graphics must be visible during event-week routes.", "eligibility":"Cars and rideshare vehicles in event-area service zones."},
    {"key":"marketplace-week", "company":"DEMO — Market Lane Online", "name":"DEMO · Market Lane Online Holiday Preview", "industry":"E-commerce", "type":"Digital roof display", "image":"hero-capital.jpg", "description":"A sample seasonal marketplace promotion from a fictional online retailer.", "areas":["Washington, DC", "Baltimore, MD"], "days":5, "length":30, "status":"ACTIVE", "slots":9, "hours":"72", "impressions":62000, "rate":"21.00", "duration":10, "requirements":"Show creative only in approved locations and during the campaign dates.", "eligibility":"Approved digital-display vehicles operating in listed areas."},
    {"key":"city-style", "company":"DEMO — City Style Collective", "name":"DEMO · City Style Fall Collection", "industry":"Retail & Fashion", "type":"Partial vehicle wrap", "image":"case-plaza.jpg", "description":"A fictional apparel retailer collection-awareness campaign.", "areas":["Washington, DC", "Alexandria, VA"], "days":7, "length":28, "status":"ACTIVE", "slots":5, "hours":"56", "impressions":36000, "rate":"18.00", "duration":15, "requirements":"Do not cover registration plates, mirrors, or safety equipment.", "eligibility":"Cars and small vans in approved service areas."},
    {"key":"river-care", "company":"DEMO — River Care Clinic", "name":"DEMO · River Care Preventive Care", "industry":"Healthcare", "type":"Door decals", "image":"audience-facade.jpg", "description":"A fictional preventive-care reminder campaign; no real healthcare service is advertised.", "areas":["Washington, DC", "Silver Spring, MD"], "days":-2, "length":20, "status":"PAUSED", "slots":4, "hours":"30", "impressions":19000, "rate":"17.50", "duration":10, "requirements":"Use the approved awareness creative only.", "eligibility":"Cars and taxis in the listed service area."},
    {"key":"campus-open-house", "company":"DEMO — Eastbank University", "name":"DEMO · Eastbank University Open House", "industry":"Education", "type":"Vehicle wrap", "image":"network-bus.jpg", "description":"A fictional university open-house announcement retained as a completed sample campaign.", "areas":["Washington, DC", "College Park, MD"], "days":-70, "length":28, "status":"COMPLETED", "slots":3, "hours":"28", "impressions":21000, "rate":"16.00", "duration":15, "requirements":"Historical demo campaign. Applications are closed.", "eligibility":"Historical demo campaign."},
]


class Command(BaseCommand):
    help = "Seed idempotent, clearly labeled demo OOH campaigns and optional driver demo activity."

    def add_arguments(self, parser):
        parser.add_argument("--business-email", help="Attach demo campaigns to an existing Business user instead of demo-only users.")
        parser.add_argument("--driver-email", help="Attach sample demo participation/activity to an existing Driver user.")
        parser.add_argument("--skip-assets", action="store_true", help="Do not upload the repository's sample creative images.")
        parser.add_argument("--ensure-storage", action="store_true", help="Create private upload buckets only if they do not exist.")

    def _ensure_asset_buckets(self):
        from django.conf import settings
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise CommandError("Supabase Storage credentials are required to prepare demo creative assets.")
        endpoint = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/bucket"
        headers = {"Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}", "apikey": settings.SUPABASE_SERVICE_ROLE_KEY, "Content-Type": "application/json"}
        try:
            with urlopen(Request(endpoint, headers=headers, method="GET"), timeout=20) as response:
                existing = {item.get("name") or item.get("id") for item in json.loads(response.read())}
            buckets = [
                (settings.SUPABASE_ADS_BUCKET, ["image/jpeg", "image/png", "image/webp"]),
                (settings.SUPABASE_DOCUMENTS_BUCKET, ["image/jpeg", "image/png", "image/webp", "application/pdf"]),
            ]
            for name, mime_types in buckets:
                if name in existing:
                    continue
                payload = json.dumps({"id": name, "name": name, "public": False, "file_size_limit": settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024, "allowed_mime_types": mime_types}).encode()
                try:
                    with urlopen(Request(endpoint, data=payload, headers=headers, method="POST"), timeout=20) as response:
                        if response.status not in (200, 201):
                            raise CommandError(f"Supabase Storage did not create the private {name} bucket.")
                except HTTPError as exc:
                    if exc.code != 409:
                        raise
            self.stdout.write("Private upload buckets are ready; existing bucket settings were left unchanged.")
        except HTTPError as exc:
            if exc.code in (401, 403):
                reason = f"Supabase Storage rejected the server credentials (HTTP {exc.code}); check that Render has the correct project URL and service-role key."
            elif exc.code == 404:
                reason = f"Supabase Storage returned HTTP 404; check that SUPABASE_URL is the project API URL, not the dashboard URL."
            else:
                reason = f"Supabase Storage returned HTTP {exc.code} while preparing private upload buckets."
            raise CommandError(reason) from exc
        except URLError as exc:
            raise CommandError("Could not reach the Supabase Storage API; check the Render SUPABASE_URL and project availability.") from exc
        except (TimeoutError, ValueError, KeyError) as exc:
            raise CommandError(f"Supabase Storage returned an invalid or incomplete response ({type(exc).__name__}).") from exc

    @transaction.atomic
    def handle(self, *args, **options):
        from django.conf import settings
        if not settings.FLEETCAST_DEMO_MODE:
            raise CommandError("Demo campaign seeding is disabled. Set FLEETCAST_DEMO_MODE=True only on a development/demo database.")
        if options["ensure_storage"] and not options["skip_assets"]:
            self._ensure_asset_buckets()
        UserModel = get_user_model()
        shared_business = None
        if options["business_email"]:
            shared_business = UserModel.objects.filter(email__iexact=options["business_email"], role=User.Role.BUSINESS).first()
            if not shared_business: raise CommandError("The specified business account does not exist or is not a Business user.")
        driver = None
        if options["driver_email"]:
            driver = UserModel.objects.filter(email__iexact=options["driver_email"], workspaces__role=User.Role.DRIVER, is_active=True).distinct().first()
            if not driver: raise CommandError("The specified driver account does not exist or is not active.")
            if not DriverProfile.objects.filter(user=driver).exists(): raise CommandError("The selected driver needs a driver profile before demo activity can be seeded.")

        today = timezone.localdate()
        created = 0
        for item in DEMO_CAMPAIGNS:
            if shared_business:
                business = shared_business
            else:
                email = f"demo-{item['key']}@demo.fleetcast.invalid"
                business, _ = UserModel.objects.get_or_create(
                    email=email,
                    defaults={"first_name":"Demo", "last_name":"Advertiser", "role":User.Role.BUSINESS, "is_active":False, "email_verified":False},
                )
                if not business.has_usable_password(): business.set_unusable_password(); business.save(update_fields=["password"])
                BusinessProfile.objects.update_or_create(user=business, defaults={"company_name":item["company"], "description":"DEMO account. Fictional sample advertiser used only for product testing."})

            ad, ad_created = Advertisement.objects.get_or_create(
                business=business, title=item["name"],
                defaults={"description":item["description"], "status":Advertisement.Status.APPROVED},
            )
            if not options["skip_assets"] and not ad.image:
                asset = Path(__file__).resolve().parents[5] / "public" / "images" / item["image"]
                if asset.exists():
                    from apps.core import store_upload
                    with asset.open("rb") as stream:
                        upload = File(stream, name=asset.name)
                        upload.content_type = "image/jpeg"
                        ad.image = store_upload(upload, "advertisements")
                    ad.save(update_fields=["image", "updated_at"])
            if ad.status != Advertisement.Status.APPROVED:
                ad.status = Advertisement.Status.APPROVED; ad.save(update_fields=["status", "updated_at"])

            start_date = today + timedelta(days=item["days"])
            end_date = start_date + timedelta(days=item["length"])
            _, was_created = Campaign.objects.update_or_create(
                business=business, name=item["name"],
                defaults={
                    "advertisement":ad, "description":item["description"], "industry":item["industry"],
                    "advertisement_type":item["type"], "budget":Decimal(item["rate"]) * Decimal(item["hours"]),
                    "start_date":start_date, "end_date":end_date, "available_driver_slots":item["slots"],
                    "service_areas":item["areas"], "expected_broadcast_hours":Decimal(item["hours"]),
                    "estimated_impressions":item["impressions"], "compensation_rate":Decimal(item["rate"]),
                    "requirements":item["requirements"], "eligibility_criteria":item["eligibility"],
                    "advertisement_duration_seconds":item["duration"], "status":item["status"], "is_demo":True,
                },
            )
            created += int(was_created)

        if driver:
            self._seed_driver_activity(driver, UserModel)
        self.stdout.write(self.style.SUCCESS(f"Demo campaign seed complete: {created} campaigns created; {len(DEMO_CAMPAIGNS) - created} updated. Demo records are marked is_demo=True and campaign names begin with DEMO."))

    def _seed_driver_activity(self, driver, UserModel):
        today = timezone.localdate()
        active = list(Campaign.objects.filter(is_demo=True, status=Campaign.Status.ACTIVE, start_date__lte=today, end_date__gte=today).order_by("name")[:2])
        if not active: return
        if CampaignParticipation.objects.filter(driver=driver, is_current=True, campaign__is_demo=False).exists() or BroadcastSession.objects.filter(participation__driver=driver, ended_at__isnull=True, participation__campaign__is_demo=False).exists():
            raise CommandError("Refusing to replace a driver's live non-demo campaign or broadcast state with demo activity.")
        CampaignParticipation.objects.filter(driver=driver, is_current=True, campaign__is_demo=True).update(is_current=False)
        participations = []
        for index, campaign in enumerate(active):
            participation, _ = CampaignParticipation.objects.update_or_create(
                campaign=campaign, driver=driver,
                defaults={"status":CampaignParticipation.Status.ACTIVE, "is_current":index == 0, "vehicle":Vehicle.objects.filter(driver=driver, is_demo=True).first()},
            )
            participations.append(participation)
        examples = [
            (participations[0], datetime(2026, 11, 18, 9, 0), 10, 120, BroadcastSession.EarningStatus.PAID),
            (participations[-1], datetime(2026, 11, 18, 9, 15), 12, 180, BroadcastSession.EarningStatus.PENDING),
            (participations[0], datetime(2026, 11, 18, 9, 30), 9, 150, BroadcastSession.EarningStatus.PENDING),
        ]
        claimed_session_ids = set()
        for participation, start_naive, plays, impressions, earning_status in examples:
            started = timezone.make_aware(start_naive, timezone.get_current_timezone())
            session = BroadcastSession.objects.filter(
                participation=participation, started_at=started,
                measurement_status=BroadcastSession.MeasurementStatus.DEMO,
            ).first()
            if not session:
                # Reuse the legacy seed's demo-only row where possible so
                # rerunning this command updates, rather than duplicates, the
                # demonstration history.
                session = BroadcastSession.objects.filter(
                    participation=participation,
                    measurement_status=BroadcastSession.MeasurementStatus.DEMO,
                ).exclude(pk__in=claimed_session_ids).order_by("id").first()
            ended = started + timedelta(minutes=15)
            if session:
                claimed_session_ids.add(session.pk)
                session.started_at = started; session.ended_at = ended; session.vehicle = participation.vehicle
                session.advertisement = participation.campaign.advertisement
                session.plays = plays; session.impressions = impressions; session.earning_status = earning_status
                session.compensation_rate_snapshot = participation.campaign.compensation_rate
                session.measurement_status = BroadcastSession.MeasurementStatus.DEMO
                session.save(update_fields=["started_at", "ended_at", "vehicle", "advertisement", "plays", "impressions", "earning_status", "compensation_rate_snapshot", "measurement_status"])
            else:
                session = BroadcastSession.objects.create(
                    participation=participation, vehicle=participation.vehicle,
                    advertisement=participation.campaign.advertisement,
                    started_at=started, ended_at=ended, plays=plays, impressions=impressions,
                    earning_status=earning_status, compensation_rate_snapshot=participation.campaign.compensation_rate,
                    measurement_status=BroadcastSession.MeasurementStatus.DEMO,
                )
                claimed_session_ids.add(session.pk)
