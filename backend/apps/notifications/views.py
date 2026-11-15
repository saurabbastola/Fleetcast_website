from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.accounts.authentication import CookieJWTAuthentication
from .models import Notification
from .serializers import NotificationSerializer
class NotificationList(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["title", "message"]
    filterset_fields = ["is_read"]
    ordering_fields = ["created_at", "is_read"]
    http_method_names = ["get", "patch", "head", "options"]
    def get_queryset(self): return Notification.objects.filter(user=self.request.user)
