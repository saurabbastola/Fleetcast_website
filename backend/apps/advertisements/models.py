from django.conf import settings
from django.db import models

class Advertisement(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        ARCHIVED = "ARCHIVED", "Archived"
    business = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="advertisements", limit_choices_to={"role": "BUSINESS"})
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image = models.CharField(max_length=500, blank=True)
    # Set by the server only when the application is explicitly in demo mode.
    is_demo = models.BooleanField(default=False, db_index=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta: ordering = ["-created_at"]
