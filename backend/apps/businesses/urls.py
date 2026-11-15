from django.urls import path
from .views import BusinessProfileView, BusinessDashboardView, AdminBusinessList
urlpatterns = [path("business/profile/", BusinessProfileView.as_view()), path("business/dashboard/", BusinessDashboardView.as_view()), path("admin/businesses/", AdminBusinessList.as_view())]
