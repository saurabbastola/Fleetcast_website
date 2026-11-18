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
        vehicles = Vehicle.objects.filter(driver=request.user)
        from apps.campaigns.models import BroadcastSession, CampaignParticipation
        from apps.campaigns.serializers import ParticipationSerializer
        from decimal import Decimal
        participations = CampaignParticipation.objects.filter(driver=request.user).exclude(status=CampaignParticipation.Status.WITHDRAWN).select_related("campaign__business__business_profile", "campaign__advertisement").prefetch_related("broadcast_sessions")
        sessions = list(BroadcastSession.objects.filter(participation__driver=request.user).select_related("participation__campaign"))
        hours = round(sum(item.hours for item in sessions), 2)
        impressions = [item.impressions for item in sessions if item.impressions is not None]
        earnings = round(sum((Decimal(str(item.hours)) * item.participation.campaign.compensation_rate for item in sessions), Decimal("0")), 2) if sessions else None
        evidence = "DEMO" if any(item.measurement_status == BroadcastSession.MeasurementStatus.DEMO for item in sessions) else "ESTIMATED" if sessions else "UNAVAILABLE"
        current = participations.filter(is_current=True).first()
        return Response({
            "vehicles": vehicles.count(), "pending_vehicles": vehicles.filter(status="PENDING").count(), "approved_vehicles": vehicles.filter(status="APPROVED").count(),
            "campaigns": participations.filter(status__in=[CampaignParticipation.Status.ACCEPTED, CampaignParticipation.Status.ACTIVE]).count(),
            "broadcast_hours": hours if sessions else None, "impressions": sum(impressions) if impressions else None,
            "earnings": earnings, "measurement_status": evidence,
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
