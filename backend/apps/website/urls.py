from django.urls import path
from .views import ContactCreateView, LeadCreateView, health_check
urlpatterns=[path("health/",health_check),path("contact/",ContactCreateView.as_view()),path("leads/",LeadCreateView.as_view())]
