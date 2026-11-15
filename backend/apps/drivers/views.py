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
        return Response({"vehicles": vehicles.count(), "pending_vehicles": vehicles.filter(status="PENDING").count(), "approved_vehicles": vehicles.filter(status="APPROVED").count(), "earnings": None, "assigned_advertisements": None})

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
