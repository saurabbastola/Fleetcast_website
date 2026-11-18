from rest_framework.routers import DefaultRouter
from django.urls import include, path
from .views import CampaignViewSet, AdminCampaignViewSet, DriverCampaignViewSet
router = DefaultRouter(); router.register("campaigns", CampaignViewSet, basename="campaign"); router.register("admin/campaigns", AdminCampaignViewSet, basename="admin-campaign")
router.register("driver/campaigns", DriverCampaignViewSet, basename="driver-campaign")
urlpatterns = [path("", include(router.urls))]
