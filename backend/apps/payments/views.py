from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from apps.accounts.permissions import IsBusinessRole
from .models import Payment
from .serializers import PaymentSerializer
class PaymentList(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsBusinessRole]
    filterset_fields = ["payment_status", "currency"]
    search_fields = ["transaction_reference"]
    ordering_fields = ["created_at", "amount", "payment_status"]
    def get_queryset(self): return Payment.objects.filter(business=self.request.user)
