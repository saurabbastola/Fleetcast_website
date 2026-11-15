from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.accounts.permissions import IsBusinessRole, IsAdminRole
from .models import Campaign
from .serializers import CampaignSerializer

class CampaignViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated, IsBusinessRole]
    search_fields = ["name", "description"]
    filterset_fields = ["status", "start_date", "end_date"]
    ordering_fields = ["created_at", "start_date", "end_date", "budget", "name"]
    def get_queryset(self): return Campaign.objects.filter(business=self.request.user)
    def perform_create(self, serializer): serializer.save(business=self.request.user)
    def perform_destroy(self, instance):
        if instance.status in (Campaign.Status.ACTIVE, Campaign.Status.APPROVED):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Approved or active campaigns cannot be deleted.")
        instance.delete()

class AdminCampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.select_related("business").all()
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    search_fields = ["name", "description", "business__email"]
    filterset_fields = ["status", "start_date", "end_date"]
    ordering_fields = ["created_at", "start_date", "budget", "name"]
    @action(detail=True, methods=["post"])
    def status(self, request, pk=None):
        item = self.get_object(); value = request.data.get("status")
        if value not in Campaign.Status.values: return Response({"error": {"message": "Invalid campaign status."}}, status=400)
        item.status = value; item.save(update_fields=["status", "updated_at"]); return Response(self.get_serializer(item).data)
