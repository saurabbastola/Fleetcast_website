from rest_framework.routers import DefaultRouter
from django.urls import include, path
from .views import CampaignViewSet, AdminCampaignViewSet
router = DefaultRouter(); router.register("campaigns", CampaignViewSet, basename="campaign"); router.register("admin/campaigns", AdminCampaignViewSet, basename="admin-campaign")
urlpatterns = [path("", include(router.urls))]
