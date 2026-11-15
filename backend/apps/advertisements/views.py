from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.accounts.permissions import IsBusinessRole, IsAdminRole
from .models import Advertisement
from .serializers import AdvertisementSerializer

class AdvertisementViewSet(viewsets.ModelViewSet):
    serializer_class = AdvertisementSerializer
    permission_classes = [IsAuthenticated, IsBusinessRole]
    search_fields = ["title", "description"]
    filterset_fields = ["status"]
    ordering_fields = ["created_at", "title", "status"]
    def get_queryset(self): return Advertisement.objects.filter(business=self.request.user)
    def perform_create(self, serializer): serializer.save(business=self.request.user)
    def perform_destroy(self, instance):
        if instance.status == Advertisement.Status.APPROVED:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Approved advertisements cannot be deleted.")
        instance.delete()

class AdminAdvertisementViewSet(viewsets.ModelViewSet):
    queryset = Advertisement.objects.select_related("business").all()
    serializer_class = AdvertisementSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    search_fields = ["title", "description", "business__email"]
    filterset_fields = ["status"]
    ordering_fields = ["created_at", "title", "status"]
    @action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        item = self.get_object(); value = request.data.get("status")
        if value not in (Advertisement.Status.APPROVED, Advertisement.Status.REJECTED): return Response({"error": {"message": "Status must be APPROVED or REJECTED."}}, status=400)
        item.status = value; item.save(update_fields=["status", "updated_at"]); return Response(self.get_serializer(item).data)
