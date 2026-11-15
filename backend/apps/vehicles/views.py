from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from apps.accounts.permissions import IsDriverRole, IsAdminRole
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
