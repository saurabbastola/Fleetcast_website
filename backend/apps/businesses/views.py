from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.permissions import IsBusinessRole, IsAdminRole
from apps.accounts.models import User
from apps.campaigns.models import Campaign
from apps.advertisements.models import Advertisement
from .models import BusinessProfile
from .serializers import BusinessProfileSerializer

class BusinessProfileView(RetrieveUpdateAPIView):
    serializer_class = BusinessProfileSerializer
    permission_classes = [IsAuthenticated, IsBusinessRole]
    def get_object(self): return BusinessProfile.objects.get(user=self.request.user)

class BusinessDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsBusinessRole]
    def get(self, request):
        return Response({"campaigns": Campaign.objects.filter(business=request.user).count(), "active_campaigns": Campaign.objects.filter(business=request.user, status=Campaign.Status.ACTIVE).count(), "advertisements": Advertisement.objects.filter(business=request.user).count(), "impressions": None, "qr_scans": None, "spend": None})

class AdminBusinessList(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    def get(self, request):
        rows = BusinessProfile.objects.select_related("user").order_by("-created_at")
        status_filter = request.query_params.get("verification_status")
        if status_filter: rows = rows.filter(verification_status=status_filter)
        term = request.query_params.get("search")
        if term: rows = rows.filter(company_name__icontains=term) | rows.filter(user__email__icontains=term)
        from django.core.paginator import Paginator
        page = Paginator(rows.distinct(), 25).get_page(request.query_params.get("page"))
        return Response({"count": rows.count(), "next": page.next_page_number() if page.has_next() else None, "previous": page.previous_page_number() if page.has_previous() else None, "results": [{"id": x.id, "user_id": x.user_id, "email": x.user.email, "company_name": x.company_name, "verification_status": x.verification_status, "created_at": x.created_at} for x in page.object_list]})
    def patch(self, request):
        profile = BusinessProfile.objects.get(pk=request.data.get("id")); state = request.data.get("verification_status")
        if state not in ("APPROVED", "REJECTED"): return Response({"error": {"message": "Status must be APPROVED or REJECTED."}}, status=400)
        profile.verification_status = state; profile.save(update_fields=["verification_status", "updated_at"]); return Response({"id": profile.id, "verification_status": state})
