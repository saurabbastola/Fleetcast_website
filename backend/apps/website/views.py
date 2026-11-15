from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle
from django.http import JsonResponse
from .models import ContactSubmission, PlaybookLead
from .serializers import ContactSubmissionSerializer, PlaybookLeadSerializer

class ContactThrottle(AnonRateThrottle): scope="contact"
class LeadThrottle(AnonRateThrottle): scope="lead"

def health_check(request):
    """Lightweight health endpoint that does not require database access."""
    return JsonResponse({"status": "ok"})

class ContactCreateView(CreateAPIView):
    authentication_classes=[]
    queryset=ContactSubmission.objects.none()
    serializer_class=ContactSubmissionSerializer
    permission_classes=[AllowAny]
    throttle_classes=[ContactThrottle]
    def perform_create(self,serializer): serializer.save()

class LeadCreateView(CreateAPIView):
    authentication_classes=[]
    queryset=PlaybookLead.objects.none()
    serializer_class=PlaybookLeadSerializer
    permission_classes=[AllowAny]
    throttle_classes=[LeadThrottle]
    def perform_create(self,serializer): serializer.save()
