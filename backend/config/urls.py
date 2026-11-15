from django.contrib import admin
from django.urls import include, path

urlpatterns = [path("django-admin/", admin.site.urls), path("api/v1/", include("apps.accounts.urls")), path("api/v1/", include("apps.businesses.urls")), path("api/v1/", include("apps.drivers.urls")), path("api/v1/", include("apps.vehicles.urls")), path("api/v1/", include("apps.advertisements.urls")), path("api/v1/", include("apps.campaigns.urls")), path("api/v1/", include("apps.payments.urls")), path("api/v1/", include("apps.notifications.urls")), path("api/v1/", include("apps.website.urls"))]
