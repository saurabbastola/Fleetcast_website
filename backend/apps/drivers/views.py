from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.permissions import IsDriverRole, IsAdminRole
from apps.accounts.models import User
from apps.vehicles.models import Vehicle
from .models import DriverProfile
from .serializers import DriverProfileSerializer

class DriverProfileView(RetrieveUpdateAPIView):
    serializer_class = DriverProfileSerializer
    permission_classes = [IsAuthenticated, IsDriverRole]
    def get_object(self): return DriverProfile.objects.get(user=self.request.user)

class DriverDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsDriverRole]
    def get(self, request):
        from django.conf import settings
        from apps.core import signed_storage_url
        from apps.businesses.models import BusinessProfile
        from apps.campaigns.models import BroadcastSession, CampaignParticipation
        from apps.campaigns.serializers import ParticipationSerializer
        from decimal import Decimal
        vehicle_queryset = Vehicle.objects.filter(driver=request.user)
        vehicles = list(vehicle_queryset.order_by("registration_number", "pk"))
        participations = list(CampaignParticipation.objects.filter(
            driver=request.user,
        ).exclude(status=CampaignParticipation.Status.WITHDRAWN).select_related(
            "campaign__business__business_profile", "campaign__advertisement", "vehicle",
        ).prefetch_related("broadcast_sessions"))
        sessions = list(BroadcastSession.objects.filter(participation__driver=request.user).select_related(
            "vehicle", "participation__vehicle", "participation__campaign__business__business_profile", "participation__campaign__advertisement",
        ).order_by("-started_at", "-pk"))
        hours = round(sum(item.hours for item in sessions), 2)
        impressions = [item.impressions for item in sessions if item.impressions is not None]
        earnings = round(sum((Decimal(str(item.hours)) * item.participation.campaign.compensation_rate for item in sessions), Decimal("0")), 2) if sessions else None
        evidence = "UNAVAILABLE" if not sessions else "DEMO" if any(item.measurement_status == BroadcastSession.MeasurementStatus.DEMO for item in sessions) else "VERIFIED" if all(item.measurement_status == BroadcastSession.MeasurementStatus.VERIFIED for item in sessions) else "ESTIMATED"
        current = next((item for item in participations if item.is_current), None)
        def advertiser(campaign):
            try: profile = campaign.business.business_profile
            except BusinessProfile.DoesNotExist: profile = None
            return (profile.company_name if profile else "") or campaign.business.get_full_name() or campaign.business.email
        def creative(campaign):
            ad = campaign.advertisement
            return {
                "campaign_id": campaign.id,
                "campaign_name": campaign.name,
                "campaign_status": campaign.status,
                "advertiser_name": advertiser(campaign),
                "advertisement_title": ad.title if ad else "Advertisement unavailable",
                "advertisement_image_url": signed_storage_url(settings.SUPABASE_ADS_BUCKET, ad.image) if ad else None,
                "is_demo": campaign.is_demo,
            }
        fleet_vehicles = []
        for vehicle in vehicles:
            linked_sessions = [session for session in sessions if session.vehicle_id == vehicle.id or (session.vehicle_id is None and session.participation.vehicle_id == vehicle.id)]
            selected = next((item for item in participations if item.vehicle_id == vehicle.id and item.is_current), None)
            open_session = next((item for item in linked_sessions if item.ended_at is None), None)
            vehicle_campaigns = {item.campaign_id: item for item in participations if item.vehicle_id == vehicle.id and item.status in (CampaignParticipation.Status.ACCEPTED, CampaignParticipation.Status.ACTIVE) and item.campaign.status == "ACTIVE"}
            current_ad = creative(selected.campaign) if selected else (creative(open_session.participation.campaign) if open_session else None)
            vehicle_impressions = [item.impressions for item in linked_sessions if item.impressions is not None]
            vehicle_earnings = round(sum((Decimal(str(item.hours)) * item.participation.campaign.compensation_rate for item in linked_sessions), Decimal("0")), 2) if linked_sessions else None
            fleet_vehicles.append({
                "id": vehicle.id, "registration_number": vehicle.registration_number, "vehicle_model": vehicle.vehicle_model,
                "vehicle_type": vehicle.vehicle_type, "status": vehicle.status, "is_demo": vehicle.is_demo,
                "is_broadcasting": open_session is not None, "advertising_status": "BROADCASTING" if open_session else "SELECTED" if current_ad else "NOT_ASSIGNED",
                "current_advertisement": {**current_ad, "started_at": open_session.started_at if open_session else None} if current_ad else None,
                "active_campaigns": len(vehicle_campaigns), "broadcast_hours": round(sum(item.hours for item in linked_sessions), 2),
                "impressions": sum(vehicle_impressions) if vehicle_impressions else None, "earnings": vehicle_earnings,
                "recent_activity_at": linked_sessions[0].started_at if linked_sessions else None,
            })
        active_campaigns = {item.campaign_id for item in participations if item.vehicle_id and item.status in (CampaignParticipation.Status.ACCEPTED, CampaignParticipation.Status.ACTIVE) and item.campaign.status == "ACTIVE"}
        recent_activity = []
        for session in sessions[:8]:
            campaign = session.participation.campaign
            vehicle = session.vehicle or session.participation.vehicle
            recent_activity.append({
                "session_id": session.id, **creative(campaign), "started_at": session.started_at,
                "ended_at": session.ended_at, "hours": session.hours, "impressions": session.impressions,
                "measurement_status": session.measurement_status,
                "vehicle": {"id": vehicle.id, "registration_number": vehicle.registration_number, "vehicle_model": vehicle.vehicle_model} if vehicle else None,
            })
        return Response({
            "vehicles": len(vehicles), "pending_vehicles": sum(1 for vehicle in vehicles if vehicle.status == "PENDING"), "approved_vehicles": sum(1 for vehicle in vehicles if vehicle.status == "APPROVED"),
            "campaigns": len(active_campaigns), "active_advertising_vehicles": sum(1 for row in fleet_vehicles if row["is_broadcasting"]),
            "broadcast_hours": hours if sessions else None, "impressions": sum(impressions) if impressions else None,
            "earnings": earnings, "measurement_status": evidence, "fleet_vehicles": fleet_vehicles,
            "recent_activity": recent_activity,
            "current_advertisement": ParticipationSerializer(current).data if current else None,
        })

class AdminDriverList(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    def get(self, request):
        rows = DriverProfile.objects.select_related("user").order_by("-created_at")
        state = request.query_params.get("verification_status")
        if state: rows = rows.filter(verification_status=state)
        term = request.query_params.get("search")
        if term: rows = rows.filter(user__email__icontains=term)
        from django.core.paginator import Paginator
        page = Paginator(rows, 25).get_page(request.query_params.get("page"))
        return Response({"count": rows.count(), "next": page.next_page_number() if page.has_next() else None, "previous": page.previous_page_number() if page.has_previous() else None, "results": [{"id": x.id, "user_id": x.user_id, "email": x.user.email, "name": x.user.get_full_name(), "verification_status": x.verification_status, "created_at": x.created_at} for x in page.object_list]})
    def patch(self, request):
        profile = DriverProfile.objects.get(pk=request.data.get("id")); state = request.data.get("verification_status")
        if state not in ("APPROVED", "REJECTED"): return Response({"error": {"message": "Status must be APPROVED or REJECTED."}}, status=400)
        profile.verification_status = state; profile.save(update_fields=["verification_status", "updated_at"]); return Response({"id": profile.id, "verification_status": state})
