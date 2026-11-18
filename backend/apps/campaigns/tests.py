from datetime import timedelta
from decimal import Decimal

from django.utils import timezone
from django.core.management import call_command
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.businesses.models import BusinessProfile
from apps.drivers.models import DriverProfile
from apps.advertisements.models import Advertisement
from apps.notifications.models import Notification
from .models import BroadcastSession, Campaign, CampaignParticipation


class CampaignParticipationWorkflowTests(APITestCase):
    def setUp(self):
        self.business = User.objects.create_user("owner@example.test", password="test-password-12345", role=User.Role.BUSINESS, first_name="Demo", last_name="Owner", is_active=True, email_verified=True)
        BusinessProfile.objects.create(user=self.business, company_name="Test Advertiser")
        self.driver = User.objects.create_user("driver@example.test", password="test-password-12345", role=User.Role.DRIVER, first_name="Test", last_name="Driver", is_active=True, email_verified=True)
        DriverProfile.objects.create(user=self.driver, verification_status=DriverProfile.Verification.APPROVED)
        self.driver_two = User.objects.create_user("driver2@example.test", password="test-password-12345", role=User.Role.DRIVER, first_name="Second", last_name="Driver", is_active=True, email_verified=True)
        DriverProfile.objects.create(user=self.driver_two, verification_status=DriverProfile.Verification.APPROVED)
        self.ad = Advertisement.objects.create(business=self.business, title="Approved creative", status=Advertisement.Status.APPROVED)
        today = timezone.localdate()
        self.campaign = Campaign.objects.create(
            business=self.business, advertisement=self.ad, name="Active sample", industry="Retail", status=Campaign.Status.ACTIVE,
            start_date=today, end_date=today + timedelta(days=14), available_driver_slots=1, service_areas=["Washington, DC"],
            expected_broadcast_hours=Decimal("20"), estimated_impressions=25000, compensation_rate=Decimal("18.00"),
        )

    def auth(self, user):
        self.client.force_authenticate(user)

    def test_driver_discovers_and_applies_to_open_campaign(self):
        self.auth(self.driver)
        available = self.client.get("/api/v1/driver/campaigns/")
        self.assertEqual(available.status_code, status.HTTP_200_OK)
        self.assertEqual(available.data[0]["advertiser_name"], "Test Advertiser")
        applied = self.client.post(f"/api/v1/driver/campaigns/{self.campaign.id}/apply/", {}, format="json")
        self.assertEqual(applied.status_code, status.HTTP_201_CREATED)
        self.assertEqual(applied.data["status"], CampaignParticipation.Status.APPLIED)
        self.assertEqual(self.client.get("/api/v1/driver/campaigns/mine/").data[0]["campaign"]["id"], self.campaign.id)

    def test_business_accepts_application_and_sees_driver(self):
        participation = CampaignParticipation.objects.create(campaign=self.campaign, driver=self.driver)
        self.auth(self.business)
        response = self.client.post(f"/api/v1/campaigns/{self.campaign.id}/participation/", {"participation_id": participation.id, "status":"ACCEPTED"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rows = self.client.get(f"/api/v1/campaigns/{self.campaign.id}/participants/")
        self.assertEqual(rows.data[0]["driver_email"], self.driver.email)
        self.assertTrue(Notification.objects.filter(user=self.driver, title__icontains="accepted").exists())

    def test_capacity_and_campaign_status_gate_applications(self):
        first = CampaignParticipation.objects.create(campaign=self.campaign, driver=self.driver)
        self.auth(self.driver_two)
        full = self.client.post(f"/api/v1/driver/campaigns/{self.campaign.id}/apply/", {}, format="json")
        self.assertEqual(full.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(CampaignParticipation.objects.filter(campaign=self.campaign, driver=self.driver_two).exists())
        self.campaign.status = Campaign.Status.PAUSED; self.campaign.save(update_fields=["status"])
        self.assertFalse(any(c["id"] == self.campaign.id for c in self.client.get("/api/v1/driver/campaigns/").data))
        self.assertEqual(first.status, CampaignParticipation.Status.APPLIED)

    def test_driver_can_switch_and_record_estimated_broadcast_hours(self):
        first = CampaignParticipation.objects.create(campaign=self.campaign, driver=self.driver, status=CampaignParticipation.Status.ACCEPTED)
        second_campaign = Campaign.objects.create(
            business=self.business, advertisement=self.ad, name="Other active sample", industry="Retail", status=Campaign.Status.ACTIVE,
            start_date=timezone.localdate(), end_date=timezone.localdate()+timedelta(days=4), available_driver_slots=2,
            compensation_rate=Decimal("16.00"),
        )
        second = CampaignParticipation.objects.create(campaign=second_campaign, driver=self.driver, status=CampaignParticipation.Status.ACCEPTED)
        self.auth(self.driver)
        switched = self.client.post(f"/api/v1/driver/campaigns/{self.campaign.id}/switch/", {}, format="json")
        self.assertEqual(switched.status_code, status.HTTP_200_OK)
        second.refresh_from_db(); self.assertFalse(second.is_current)
        started = self.client.post(f"/api/v1/driver/campaigns/{self.campaign.id}/start_broadcast/", {}, format="json")
        self.assertEqual(started.status_code, status.HTTP_201_CREATED)
        session = BroadcastSession.objects.get(pk=started.data["session_id"])
        self.assertEqual(session.measurement_status, BroadcastSession.MeasurementStatus.ESTIMATED)
        first.refresh_from_db()
        self.assertTrue(first.is_current)
        stopped = self.client.post(f"/api/v1/driver/campaigns/{self.campaign.id}/stop_broadcast/", {}, format="json")
        self.assertEqual(stopped.status_code, status.HTTP_200_OK)
        session.refresh_from_db(); self.assertIsNotNone(session.ended_at)

    def test_switch_requires_stopping_current_timer_first(self):
        one = CampaignParticipation.objects.create(campaign=self.campaign, driver=self.driver, status=CampaignParticipation.Status.ACTIVE, is_current=True)
        other_campaign = Campaign.objects.create(business=self.business, advertisement=self.ad, name="Second", status=Campaign.Status.ACTIVE, start_date=timezone.localdate(), end_date=timezone.localdate()+timedelta(days=1), available_driver_slots=1)
        CampaignParticipation.objects.create(campaign=other_campaign, driver=self.driver, status=CampaignParticipation.Status.ACCEPTED)
        BroadcastSession.objects.create(participation=one, started_at=timezone.now())
        self.auth(self.driver)
        response = self.client.post(f"/api/v1/driver/campaigns/{other_campaign.id}/switch/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_pausing_closes_broadcast_notifies_driver_and_removes_campaign(self):
        participation = CampaignParticipation.objects.create(campaign=self.campaign, driver=self.driver, status=CampaignParticipation.Status.ACTIVE, is_current=True)
        session = BroadcastSession.objects.create(participation=participation, started_at=timezone.now()-timedelta(hours=1))
        self.auth(self.business)
        paused = self.client.post(f"/api/v1/campaigns/{self.campaign.id}/status/", {"status":"PAUSED"}, format="json")
        self.assertEqual(paused.status_code, status.HTTP_200_OK)
        session.refresh_from_db(); participation.refresh_from_db()
        self.assertIsNotNone(session.ended_at)
        self.assertEqual(participation.status, CampaignParticipation.Status.ACCEPTED)
        self.assertFalse(participation.is_current)
        self.assertTrue(Notification.objects.filter(user=self.driver, message__icontains="paused").exists())
        self.auth(self.driver)
        self.assertFalse(any(row["id"] == self.campaign.id for row in self.client.get("/api/v1/driver/campaigns/").data))

    def test_driver_cannot_view_other_business_campaigns_and_activation_requires_approved_ad(self):
        other = User.objects.create_user("other@example.test", password="test-password-12345", role=User.Role.BUSINESS, is_active=True, email_verified=True)
        BusinessProfile.objects.create(user=other, company_name="Other Business")
        self.auth(other)
        self.assertEqual(self.client.get("/api/v1/campaigns/").data["count"], 0)
        pending_ad = Advertisement.objects.create(business=other, title="Unapproved", status=Advertisement.Status.PENDING)
        draft = Campaign.objects.create(business=other, advertisement=pending_ad, name="Needs approval", available_driver_slots=1, start_date=timezone.localdate(), end_date=timezone.localdate()+timedelta(days=1))
        response = self.client.post(f"/api/v1/campaigns/{draft.id}/status/", {"status":"ACTIVE"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_demo_seed_is_repeatable_and_marks_metrics_as_demo(self):
        call_command("seed_demo_campaigns", skip_assets=True, verbosity=0)
        first_count = Campaign.objects.filter(is_demo=True).count()
        self.assertEqual(first_count, 12)
        call_command("seed_demo_campaigns", skip_assets=True, verbosity=0)
        self.assertEqual(Campaign.objects.filter(is_demo=True).count(), first_count)
        test_driver = User.objects.create_user("seed-driver@example.test", role=User.Role.DRIVER, is_active=True, email_verified=True)
        DriverProfile.objects.create(user=test_driver)
        call_command("seed_demo_campaigns", skip_assets=True, driver_email=test_driver.email, verbosity=0)
        self.assertEqual(BroadcastSession.objects.filter(participation__driver=test_driver, measurement_status=BroadcastSession.MeasurementStatus.DEMO).count(), 2)
        call_command("seed_demo_campaigns", skip_assets=True, driver_email=test_driver.email, verbosity=0)
        self.assertEqual(BroadcastSession.objects.filter(participation__driver=test_driver, measurement_status=BroadcastSession.MeasurementStatus.DEMO).count(), 2)
