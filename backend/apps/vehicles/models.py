from django.conf import settings
from django.db import models

class Vehicle(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
    driver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vehicles", limit_choices_to={"role": "DRIVER"})
    registration_number = models.CharField(max_length=32, unique=True)
    vehicle_model = models.CharField(max_length=160)
    vehicle_type = models.CharField(max_length=80)
    registration_document = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta: ordering = ["-created_at"]
