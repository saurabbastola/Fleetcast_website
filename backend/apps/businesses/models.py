from django.conf import settings
from django.db import models

class BusinessProfile(models.Model):
    class Verification(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="business_profile")
    company_name = models.CharField(max_length=200, blank=True)
    business_address = models.TextField(blank=True)
    website = models.URLField(blank=True)
    description = models.TextField(blank=True)
    company_logo = models.CharField(max_length=500, blank=True)
    verification_status = models.CharField(max_length=12, choices=Verification.choices, default=Verification.PENDING, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self): return self.company_name
