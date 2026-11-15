from django.urls import path
from .views import PaymentList
urlpatterns = [path("payments/", PaymentList.as_view())]
