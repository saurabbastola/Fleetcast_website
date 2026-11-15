from django.conf import settings
from django.db import models
from django.db.models import F, Q

class Campaign(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PENDING = "PENDING", "Pending review"
        APPROVED = "APPROVED", "Approved"
        ACTIVE = "ACTIVE", "Active"
        PAUSED = "PAUSED", "Paused"
        COMPLETED = "COMPLETED", "Completed"
        REJECTED = "REJECTED", "Rejected"
    business = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="campaigns", limit_choices_to={"role": "BUSINESS"})
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.DRAFT, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(condition=Q(budget__gte=0), name="campaign_budget_nonnegative"),
            models.CheckConstraint(condition=Q(start_date__isnull=True) | Q(end_date__isnull=True) | Q(end_date__gte=F("start_date")), name="campaign_dates_in_order"),
        ]
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.budget < 0: raise ValidationError({"budget": "Budget cannot be negative."})
        if self.start_date and self.end_date and self.end_date < self.start_date: raise ValidationError({"end_date": "End date must be on or after start date."})
