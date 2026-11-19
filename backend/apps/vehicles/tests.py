from datetime import timedelta
from decimal import Decimal

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User, UserWorkspace
from apps.advertisements.models import Advertisement
from apps.businesses.models import BusinessProfile
from apps.campaigns.models import BroadcastSession, Campaign, CampaignParticipation
from apps.drivers.models import DriverProfile
from apps.vehicles.models import Vehicle


class VehicleFleetActivityTests(APITestCase):
    def setUp(self):
        self.driver = User.objects.create_user("fleet@example.test", password="test-password-12345", role=User.Role.DRIVER, is_active=True, email_verified=True)
        DriverProfile.objects.create(user=self.driver, verification_status=DriverProfile.Verification.PENDING)
        self.other_driver = User.objects.create_user("other-fleet@example.test", password="test-password-12345", role=User.Role.DRIVER, is_active=True, email_verified=True)
        DriverProfile.objects.create(user=self.other_driver)
        self.vehicle = Vehicle.objects.create(driver=self.driver, registration_number="FLEET-101", vehicle_model="Demo Sedan", vehicle_type="Car", status=Vehicle.Status.APPROVED, is_demo=True)
        self.other_vehicle = Vehicle.objects.create(driver=self.other_driver, registration_number="FLEET-202", vehicle_model="Other Car", vehicle_type="Car")
        self.business = User.objects.create_user("advertiser@example.test", role=User.Role.BUSINESS, is_active=True, email_verified=True)
        BusinessProfile.objects.create(user=self.business, company_name="Sample Advertiser")
        advertisement = Advertisement.objects.create(business=self.business, title="Sample creative", image="samples/creative.jpg", status=Advertisement.Status.APPROVED)
        today = timezone.localdate()
        self.campaign = Campaign.objects.create(
            business=self.business, advertisement=advertisement, name="Sample campaign", status=Campaign.Status.ACTIVE,
            start_date=today, end_date=today + timedelta(days=7), compensation_rate=Decimal("18.00"), is_demo=True,
        )

    def test_fleet_overview_aggregates_vehicle_sessions_and_history(self):
        participation = CampaignParticipation.objects.create(
            campaign=self.campaign, driver=self.driver, vehicle=self.vehicle,
            status=CampaignParticipation.Status.ACTIVE, is_current=True,
        )
        started = timezone.now() - timedelta(hours=2)
        BroadcastSession.objects.create(
            participation=participation, vehicle=self.vehicle, started_at=started,
            ended_at=started + timedelta(hours=1), impressions=1800,
            measurement_status=BroadcastSession.MeasurementStatus.DEMO,
        )
        self.client.force_authenticate(self.driver)
        response = self.client.get("/api/v1/driver/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["vehicles"], 1)
        self.assertEqual(response.data["campaigns"], 1)
        vehicle = response.data["fleet_vehicles"][0]
        self.assertEqual(vehicle["id"], self.vehicle.id)
        self.assertEqual(vehicle["current_advertisement"]["campaign_name"], self.campaign.name)
        self.assertEqual(vehicle["broadcast_hours"], 1.0)
        self.assertEqual(vehicle["impressions"], 1800)
        self.assertEqual(response.data["measurement_status"], "DEMO")
        detail = self.client.get(f"/api/v1/vehicles/{self.vehicle.id}/activity/")
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertEqual(detail.data["activity"][0]["advertisement_title"], "Sample creative")
        self.assertEqual(detail.data["activity"][0]["campaign_status"], Campaign.Status.ACTIVE)
        self.assertEqual(detail.data["activity"][0]["impressions"], 1800)

    def test_driver_cannot_read_another_owners_vehicle_history(self):
        self.client.force_authenticate(self.driver)
        response = self.client.get(f"/api/v1/vehicles/{self.other_vehicle.id}/activity/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class DemoFleetSeedTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("seed-fleet@example.test", role=User.Role.BUSINESS, is_active=True, email_verified=True)
        UserWorkspace.objects.get_or_create(user=self.user, role=User.Role.DRIVER)
        DriverProfile.objects.create(user=self.user)

    @override_settings(DEBUG=True, FLEETCAST_DEMO_MODE=True)
    def test_seed_command_only_uses_existing_driver_workspace_and_is_repeatable(self):
        call_command("seed_demo_fleet", email=self.user.email, verbosity=0)
        call_command("seed_demo_fleet", email=self.user.email, verbosity=0)
        vehicles = Vehicle.objects.filter(driver=self.user, is_demo=True)
        self.assertEqual(vehicles.count(), 1)
        vehicle = vehicles.get()
        self.assertEqual(vehicle.status, Vehicle.Status.APPROVED)
        self.assertTrue(CampaignParticipation.objects.filter(driver=self.user, vehicle=vehicle, campaign__is_demo=True).exists())
        self.assertGreaterEqual(BroadcastSession.objects.filter(participation__driver=self.user, vehicle=vehicle, measurement_status=BroadcastSession.MeasurementStatus.DEMO).count(), 2)

    @override_settings(DEBUG=False, FLEETCAST_DEMO_MODE=False)
    def test_seed_command_refuses_when_demo_mode_is_disabled(self):
        with self.assertRaises(CommandError):
            call_command("seed_demo_fleet", email=self.user.email, verbosity=0)
        self.assertFalse(Vehicle.objects.filter(driver=self.user).exists())
