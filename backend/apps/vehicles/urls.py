from rest_framework.routers import DefaultRouter
from django.urls import include, path
from .views import VehicleViewSet, AdminVehicleViewSet
router = DefaultRouter(); router.register("vehicles", VehicleViewSet, basename="vehicle"); router.register("admin/vehicles", AdminVehicleViewSet, basename="admin-vehicle")
urlpatterns = [path("", include(router.urls))]
