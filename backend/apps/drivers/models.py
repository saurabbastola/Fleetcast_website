from django.conf import settings
from django.db import models

class DriverProfile(models.Model):
    class Verification(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="driver_profile")
    address = models.TextField(blank=True)
    license_number = models.CharField(max_length=100, blank=True)
    profile_photo = models.CharField(max_length=500, blank=True)
    verification_status = models.CharField(max_length=12, choices=Verification.choices, default=Verification.PENDING, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
