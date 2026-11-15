from rest_framework.routers import DefaultRouter
from django.urls import include, path
from .views import AdvertisementViewSet, AdminAdvertisementViewSet
router = DefaultRouter(); router.register("advertisements", AdvertisementViewSet, basename="advertisement"); router.register("admin/advertisements", AdminAdvertisementViewSet, basename="admin-advertisement")
urlpatterns = [path("", include(router.urls))]
