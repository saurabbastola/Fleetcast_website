from django.urls import path
from .views import DriverProfileView, DriverDashboardView, DriverEarningsView, AdminDriverList
urlpatterns = [path("driver/profile/", DriverProfileView.as_view()), path("driver/dashboard/", DriverDashboardView.as_view()), path("driver/earnings/", DriverEarningsView.as_view()), path("admin/drivers/", AdminDriverList.as_view())]
