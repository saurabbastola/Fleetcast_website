from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django.conf import settings
from django.db.models import Q
from apps.accounts.permissions import IsDriverRole, IsAdminRole
from apps.campaigns.models import BroadcastSession, CampaignParticipation
from apps.campaigns.serializers import BroadcastSessionSerializer, ParticipationSerializer
from apps.businesses.models import BusinessProfile
from apps.core import signed_storage_url
from .models import Vehicle
from .serializers import VehicleSerializer

class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated, IsDriverRole]
    search_fields = ["registration_number", "vehicle_model", "vehicle_type"]
    filterset_fields = ["status", "vehicle_type"]
    ordering_fields = ["created_at", "registration_number", "status"]
    def get_queryset(self): return Vehicle.objects.filter(driver=self.request.user)
    def perform_create(self, serializer): serializer.save(driver=self.request.user)

    @action(detail=True, methods=["get"])
    def activity(self, request, pk=None):
        vehicle = self.get_object()
        sessions = list(BroadcastSession.objects.filter(
            Q(vehicle=vehicle) | Q(vehicle__isnull=True, participation__vehicle=vehicle),
        ).select_related(
            "vehicle", "advertisement", "participation__campaign__business__business_profile", "participation__campaign__advertisement",
        ).order_by("-started_at", "-pk"))
        activity = []
        for session in sessions:
            campaign = session.participation.campaign
            business = campaign.business
            try: profile = business.business_profile
            except BusinessProfile.DoesNotExist: profile = None
            advertisement = session.advertisement or campaign.advertisement
            activity.append({
                **BroadcastSessionSerializer(session).data,
                "campaign_id": campaign.id,
                "campaign_name": campaign.name,
                "campaign_status": campaign.status,
                "is_demo": campaign.is_demo,
                "advertiser_name": (profile.company_name if profile else "") or business.get_full_name() or business.email,
                "advertisement_title": advertisement.title if advertisement else "Advertisement unavailable",
                "advertisement_image_url": signed_storage_url(settings.SUPABASE_ADS_BUCKET, advertisement.image) if advertisement else None,
            })
        current = CampaignParticipation.objects.filter(
            driver=request.user, vehicle=vehicle, is_current=True,
        ).select_related("campaign__business__business_profile", "campaign__advertisement", "vehicle").prefetch_related("broadcast_sessions").first()
        return Response({
            "vehicle": self.get_serializer(vehicle).data,
            "current_advertisement": ParticipationSerializer(current).data if current else None,
            "activity": activity,
        })

class AdminVehicleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Vehicle.objects.select_related("driver").all()
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    search_fields = ["registration_number", "vehicle_model", "vehicle_type", "driver__email"]
    filterset_fields = ["status", "vehicle_type"]
    ordering_fields = ["created_at", "status"]
    @action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        vehicle = self.get_object(); new_status = request.data.get("status")
        if new_status not in (Vehicle.Status.APPROVED, Vehicle.Status.REJECTED): return Response({"error": {"message": "Status must be APPROVED or REJECTED."}}, status=400)
        vehicle.status = new_status; vehicle.save(update_fields=["status", "updated_at"]); return Response(self.get_serializer(vehicle).data)
