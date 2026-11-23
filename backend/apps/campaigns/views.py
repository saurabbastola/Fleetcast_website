from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import IsBusinessRole, IsDriverRole, IsAdminRole
from apps.notifications.models import Notification
from apps.vehicles.models import Vehicle
from .models import BroadcastSession, Campaign, CampaignParticipation
from .serializers import CampaignSerializer, ParticipationSerializer


ACTIVE_PARTICIPATION_STATUSES = [CampaignParticipation.Status.APPLIED, CampaignParticipation.Status.ACCEPTED, CampaignParticipation.Status.ACTIVE]


def notify_participants(campaign, message, *, completed=False):
    now = timezone.now()
    participations = campaign.participations.select_related("driver").exclude(status__in=[CampaignParticipation.Status.WITHDRAWN, CampaignParticipation.Status.REJECTED])
    for participation in participations:
        if completed:
            participation.status = CampaignParticipation.Status.COMPLETED
        elif participation.status == CampaignParticipation.Status.ACTIVE:
            participation.status = CampaignParticipation.Status.ACCEPTED
        participation.is_current = False
        participation.save(update_fields=["status", "is_current", "updated_at"])
        BroadcastSession.objects.filter(participation=participation, ended_at__isnull=True).update(ended_at=now)
        Notification.objects.create(user=participation.driver, title=f"Campaign update: {campaign.name}", message=message)


def validate_campaign_activation(campaign):
    approved_demo_ad = bool(campaign.is_demo and campaign.advertisement_id and campaign.advertisement.is_demo)
    if not campaign.advertisement_id or (campaign.advertisement.status != "APPROVED" and not approved_demo_ad):
        raise ValidationError({"advertisement": "Attach an approved advertisement before making this campaign available."})
    if not campaign.start_date or not campaign.end_date:
        raise ValidationError({"dates": "Campaign start and end dates are required before activation."})
    if campaign.available_driver_slots < 1:
        raise ValidationError({"available_driver_slots": "Set at least one driver slot before activation."})


class CampaignViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated, IsBusinessRole]
    search_fields = ["name", "description", "industry"]
    filterset_fields = ["status", "industry", "start_date", "end_date"]
    ordering_fields = ["created_at", "start_date", "end_date", "budget", "name"]

    def get_queryset(self):
        return Campaign.objects.filter(business=self.request.user).select_related("business__business_profile", "advertisement").prefetch_related("participations__broadcast_sessions").annotate(
            joined_count=Count("participations", filter=Q(participations__status__in=ACTIVE_PARTICIPATION_STATUSES), distinct=True)
        ).order_by("-created_at", "pk")

    def perform_create(self, serializer):
        from django.conf import settings
        serializer.save(business=self.request.user, is_demo=settings.FLEETCAST_DEMO_MODE)

    @action(detail=True, methods=["get"])
    def participants(self, request, pk=None):
        campaign = self.get_object()
        rows = campaign.participations.select_related("driver", "vehicle", "campaign__business__business_profile", "campaign__advertisement").prefetch_related("broadcast_sessions")
        return Response(ParticipationSerializer(rows, many=True).data)

    @action(detail=True, methods=["post"])
    def participation(self, request, pk=None):
        campaign = self.get_object()
        participation = CampaignParticipation.objects.select_related("driver").filter(campaign=campaign, pk=request.data.get("participation_id")).first()
        if not participation: return Response({"error": {"message": "Participation not found."}}, status=404)
        value = request.data.get("status")
        if participation.status != CampaignParticipation.Status.APPLIED or value not in (CampaignParticipation.Status.ACCEPTED, CampaignParticipation.Status.REJECTED):
            raise ValidationError({"status": "Only applications can be accepted or rejected."})
        with transaction.atomic():
            if value == CampaignParticipation.Status.ACCEPTED:
                current = campaign.participations.exclude(pk=participation.pk).filter(status__in=[CampaignParticipation.Status.ACCEPTED, CampaignParticipation.Status.ACTIVE]).count()
                if campaign.status != Campaign.Status.ACTIVE: raise ValidationError("Only active campaigns can accept drivers.")
                if campaign.available_driver_slots and current >= campaign.available_driver_slots:
                    raise ValidationError({"detail": "This campaign has no open driver slots."})
            participation.status = value
            participation.save(update_fields=["status", "updated_at"])
            Notification.objects.create(user=participation.driver, title=f"Campaign application {value.lower()}", message=f"Your application for {campaign.name} was {value.lower()}.")
        return Response(ParticipationSerializer(participation).data)

    @action(detail=True, methods=["post"])
    def status(self, request, pk=None):
        campaign = self.get_object()
        value = request.data.get("status")
        if value not in (Campaign.Status.ACTIVE, Campaign.Status.PAUSED, Campaign.Status.COMPLETED):
            raise ValidationError({"status": "Choose ACTIVE, PAUSED, or COMPLETED."})
        if campaign.status == Campaign.Status.COMPLETED and value != Campaign.Status.COMPLETED:
            raise ValidationError({"status": "A completed campaign cannot be reopened."})
        if value == Campaign.Status.ACTIVE:
            validate_campaign_activation(campaign)
        previous_status = campaign.status
        campaign.status = value
        campaign.save(update_fields=["status", "updated_at"])
        if value in (Campaign.Status.PAUSED, Campaign.Status.COMPLETED):
            notify_participants(campaign, f"{campaign.name} is now {value.lower()}.", completed=value == Campaign.Status.COMPLETED)
        elif value == Campaign.Status.ACTIVE and previous_status == Campaign.Status.PAUSED:
            for participation in campaign.participations.exclude(status__in=[CampaignParticipation.Status.WITHDRAWN, CampaignParticipation.Status.REJECTED]):
                Notification.objects.create(user=participation.driver, title=f"Campaign resumed: {campaign.name}", message=f"{campaign.name} has resumed. Check your dashboard for participation details.")
        return Response(self.get_serializer(campaign).data)

    def perform_destroy(self, instance):
        if instance.status in (Campaign.Status.ACTIVE, Campaign.Status.APPROVED):
            raise PermissionDenied("Approved or active campaigns cannot be deleted.")
        instance.delete()


class AdminCampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.select_related("business__business_profile", "advertisement").prefetch_related("participations__broadcast_sessions").annotate(
        joined_count=Count("participations", filter=Q(participations__status__in=ACTIVE_PARTICIPATION_STATUSES), distinct=True)
    ).order_by("-created_at", "pk")
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    search_fields = ["name", "description", "business__email", "industry"]
    filterset_fields = ["status", "industry", "start_date", "end_date"]
    ordering_fields = ["created_at", "start_date", "budget", "name"]

    @action(detail=True, methods=["post"])
    def status(self, request, pk=None):
        item = self.get_object(); value = request.data.get("status")
        if value not in Campaign.Status.values: raise ValidationError({"status": "Invalid campaign status."})
        if value == Campaign.Status.ACTIVE: validate_campaign_activation(item)
        item.status = value; item.save(update_fields=["status", "updated_at"])
        if value in (Campaign.Status.PAUSED, Campaign.Status.COMPLETED):
            notify_participants(item, f"{item.name} is now {value.lower()}.", completed=value == Campaign.Status.COMPLETED)
        return Response(self.get_serializer(item).data)

    @action(detail=True, methods=["get"])
    def participants(self, request, pk=None):
        campaign = self.get_object()
        rows = campaign.participations.select_related("driver", "vehicle", "campaign__business__business_profile", "campaign__advertisement").prefetch_related("broadcast_sessions")
        return Response(ParticipationSerializer(rows, many=True).data)


class DriverCampaignViewSet(viewsets.GenericViewSet):
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated, IsDriverRole]
    queryset = Campaign.objects.select_related("business__business_profile", "advertisement")

    def list(self, request):
        today = timezone.localdate()
        qs = self.get_queryset().filter(status=Campaign.Status.ACTIVE, start_date__lte=today, end_date__gte=today).annotate(
            joined_count=Count("participations", filter=Q(participations__status__in=ACTIVE_PARTICIPATION_STATUSES), distinct=True)
        ).filter(available_driver_slots__gt=0)
        qs = [campaign for campaign in qs if campaign.joined_count < campaign.available_driver_slots]
        term = request.query_params.get("search")
        if term: qs = [campaign for campaign in qs if term.casefold() in f"{campaign.name} {campaign.description} {campaign.industry} {' '.join(campaign.service_areas)}".casefold()]
        industry = request.query_params.get("industry")
        if industry: qs = [campaign for campaign in qs if campaign.industry.casefold() == industry.casefold()]
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False, methods=["get"], url_path="mine")
    def mine(self, request):
        rows = CampaignParticipation.objects.filter(driver=request.user).exclude(status=CampaignParticipation.Status.WITHDRAWN).select_related("campaign__business__business_profile", "campaign__advertisement", "driver", "vehicle").prefetch_related("broadcast_sessions")
        return Response(ParticipationSerializer(rows, many=True).data)

    @action(detail=False, methods=["post"], url_path="demo")
    def start_demo(self, request):
        """Self-enroll in labeled demo campaigns without driver/vehicle approval gates."""
        today = timezone.localdate()
        campaigns = list(Campaign.objects.filter(
            is_demo=True, status=Campaign.Status.ACTIVE,
            start_date__lte=today, end_date__gte=today,
            advertisement__isnull=False,
        ).select_related("business__business_profile", "advertisement").order_by("name"))
        if not campaigns:
            raise ValidationError("No active demo campaigns are available. Ask an administrator to run the demo campaign seed command.")
        result = []
        with transaction.atomic():
            for campaign in campaigns:
                participation, created = CampaignParticipation.objects.get_or_create(
                    campaign=campaign, driver=request.user,
                    defaults={"status": CampaignParticipation.Status.ACCEPTED},
                )
                if not created and participation.status in (CampaignParticipation.Status.WITHDRAWN, CampaignParticipation.Status.REJECTED):
                    participation.status = CampaignParticipation.Status.ACCEPTED
                    participation.save(update_fields=["status", "updated_at"])
                if participation.status not in (CampaignParticipation.Status.WITHDRAWN, CampaignParticipation.Status.REJECTED):
                    result.append(participation)
            if not CampaignParticipation.objects.filter(driver=request.user, is_current=True).exists() and not BroadcastSession.objects.filter(participation__driver=request.user, ended_at__isnull=True).exists() and result:
                result[0].is_current = True
                result[0].save(update_fields=["is_current", "updated_at"])
        return Response(ParticipationSerializer(result, many=True).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="vehicle")
    def select_vehicle(self, request, pk=None):
        campaign = self.get_object()
        participation = CampaignParticipation.objects.filter(
            campaign=campaign, driver=request.user,
            status__in=[CampaignParticipation.Status.ACCEPTED, CampaignParticipation.Status.ACTIVE],
        ).select_related("campaign", "driver", "vehicle").first()
        if not participation:
            raise PermissionDenied("Join or be accepted to this campaign before assigning it to a vehicle.")
        vehicle_id = request.data.get("vehicle_id")
        vehicle = None
        if vehicle_id not in (None, ""):
            try:
                vehicle_pk = int(vehicle_id)
            except (TypeError, ValueError):
                raise ValidationError({"vehicle_id": "Choose a valid registered vehicle."})
            vehicle = Vehicle.objects.filter(pk=vehicle_pk, driver=request.user).first()
            if not vehicle:
                raise ValidationError({"vehicle_id": "Choose one of your own registered vehicles."})
        if campaign.status != Campaign.Status.ACTIVE:
            raise ValidationError("Only active campaigns can be selected for a vehicle.")
        open_same = BroadcastSession.objects.filter(participation=participation, ended_at__isnull=True).exists()
        if open_same and (vehicle.id if vehicle else None) != participation.vehicle_id:
            raise ValidationError("Stop this broadcast before changing its assigned vehicle.")
        open_other = BroadcastSession.objects.filter(participation__driver=request.user, ended_at__isnull=True).exclude(participation=participation).exists()
        if open_other:
            raise ValidationError("Stop the current broadcast before assigning a different campaign to a vehicle.")
        with transaction.atomic():
            if vehicle:
                CampaignParticipation.objects.filter(driver=request.user, is_current=True).exclude(pk=participation.pk).update(is_current=False)
                participation.is_current = True
            else:
                participation.is_current = False
            participation.vehicle = vehicle
            participation.save(update_fields=["vehicle", "is_current", "updated_at"])
        return Response(ParticipationSerializer(participation).data)

    @action(detail=True, methods=["post"])
    def apply(self, request, pk=None):
        campaign = self.get_object()
        today = timezone.localdate()
        if campaign.status != Campaign.Status.ACTIVE or not campaign.start_date or not campaign.end_date or not campaign.start_date <= today <= campaign.end_date:
            raise ValidationError("This campaign is not currently accepting drivers.")
        with transaction.atomic():
            locked = Campaign.objects.select_for_update().get(pk=campaign.pk)
            current = locked.participations.filter(status__in=ACTIVE_PARTICIPATION_STATUSES).count()
            if not locked.available_driver_slots or current >= locked.available_driver_slots:
                raise ValidationError("This campaign has no open driver slots.")
            participation, created = CampaignParticipation.objects.get_or_create(campaign=locked, driver=request.user, defaults={"status": CampaignParticipation.Status.APPLIED})
            if not created and participation.status not in (CampaignParticipation.Status.WITHDRAWN, CampaignParticipation.Status.REJECTED):
                raise ValidationError("You already have an application for this campaign.")
            if not created:
                participation.status = CampaignParticipation.Status.APPLIED
                participation.is_current = False
                participation.save(update_fields=["status", "is_current", "updated_at"])
        return Response(ParticipationSerializer(participation).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def switch(self, request, pk=None):
        campaign = self.get_object()
        participation = CampaignParticipation.objects.filter(campaign=campaign, driver=request.user, status__in=[CampaignParticipation.Status.ACCEPTED, CampaignParticipation.Status.ACTIVE]).first()
        if not participation: raise PermissionDenied("You must be accepted into this campaign before switching to it.")
        if campaign.status != Campaign.Status.ACTIVE: raise ValidationError("This campaign is not currently active.")
        if BroadcastSession.objects.filter(participation__driver=request.user, ended_at__isnull=True).exists():
            raise ValidationError("Stop the current broadcast timer before switching advertisements.")
        with transaction.atomic():
            CampaignParticipation.objects.filter(driver=request.user, is_current=True).update(is_current=False)
            participation.is_current = True
            participation.save(update_fields=["is_current", "updated_at"])
        return Response(ParticipationSerializer(participation).data)

    @action(detail=True, methods=["post"])
    def start_broadcast(self, request, pk=None):
        campaign = self.get_object()
        participation = CampaignParticipation.objects.filter(campaign=campaign, driver=request.user, status__in=[CampaignParticipation.Status.ACCEPTED, CampaignParticipation.Status.ACTIVE]).first()
        if not participation: raise PermissionDenied("You must be accepted into this campaign before broadcasting.")
        if campaign.status != Campaign.Status.ACTIVE: raise ValidationError("This campaign is not currently active.")
        with transaction.atomic():
            User.objects.select_for_update().get(pk=request.user.pk)
            previous_session = BroadcastSession.objects.select_for_update().filter(participation__driver=request.user, ended_at__isnull=True).select_related("participation").first()
            now = timezone.now()
            if previous_session and previous_session.participation_id == participation.id:
                raise ValidationError("This advertisement is already broadcasting.")
            if previous_session:
                # Each interval is an immutable event. Switching ads ends the
                # previous interval before opening the next one.
                previous_session.ended_at = now
                previous_session.save(update_fields=["ended_at"])
                CampaignParticipation.objects.filter(pk=previous_session.participation_id).update(is_current=False)
            CampaignParticipation.objects.filter(driver=request.user, is_current=True).update(is_current=False)
            participation.is_current = True; participation.status = CampaignParticipation.Status.ACTIVE
            participation.save(update_fields=["is_current", "status", "updated_at"])
            measurement_status = BroadcastSession.MeasurementStatus.DEMO if campaign.is_demo else BroadcastSession.MeasurementStatus.ESTIMATED
            session = BroadcastSession.objects.create(
                participation=participation, vehicle=participation.vehicle, started_at=now,
                advertisement=campaign.advertisement,
                compensation_rate_snapshot=campaign.compensation_rate,
                measurement_status=measurement_status,
            )
        return Response({"participation": ParticipationSerializer(participation).data, "session_id": session.id}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def stop_broadcast(self, request, pk=None):
        participation = CampaignParticipation.objects.filter(campaign=self.get_object(), driver=request.user).first()
        if not participation: raise PermissionDenied("You are not participating in this campaign.")
        session = BroadcastSession.objects.filter(participation=participation, ended_at__isnull=True).first()
        if not session: raise ValidationError("There is no active broadcast session for this campaign.")
        session.ended_at = timezone.now(); session.save(update_fields=["ended_at"])
        return Response({"session": {"id": session.id, "hours": session.hours, "earnings": session.earnings_amount, "earning_status": session.earning_status, "measurement_status": session.measurement_status}})

    @action(detail=True, methods=["post"])
    def withdraw(self, request, pk=None):
        participation = CampaignParticipation.objects.filter(campaign=self.get_object(), driver=request.user).first()
        if not participation: raise PermissionDenied("You are not participating in this campaign.")
        if participation.status == CampaignParticipation.Status.ACTIVE and BroadcastSession.objects.filter(participation=participation, ended_at__isnull=True).exists():
            raise ValidationError("Stop the active broadcast before withdrawing.")
        participation.status = CampaignParticipation.Status.WITHDRAWN; participation.is_current = False
        participation.save(update_fields=["status", "is_current", "updated_at"])
        return Response(ParticipationSerializer(participation).data)
