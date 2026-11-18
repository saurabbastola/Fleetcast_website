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
    advertisement = models.ForeignKey("advertisements.Advertisement", null=True, blank=True, on_delete=models.SET_NULL, related_name="campaigns")
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    industry = models.CharField(max_length=80, blank=True)
    advertisement_type = models.CharField(max_length=80, blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    available_driver_slots = models.PositiveIntegerField(default=0)
    service_areas = models.JSONField(default=list, blank=True)
    expected_broadcast_hours = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    estimated_impressions = models.PositiveBigIntegerField(null=True, blank=True)
    compensation_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    requirements = models.TextField(blank=True)
    eligibility_criteria = models.TextField(blank=True)
    advertisement_duration_seconds = models.PositiveSmallIntegerField(null=True, blank=True)
    is_demo = models.BooleanField(default=False, db_index=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.DRAFT, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(condition=Q(budget__gte=0), name="campaign_budget_nonnegative"),
            models.CheckConstraint(condition=Q(start_date__isnull=True) | Q(end_date__isnull=True) | Q(end_date__gte=F("start_date")), name="campaign_dates_in_order"),
            models.CheckConstraint(condition=Q(compensation_rate__gte=0), name="campaign_rate_nonnegative"),
            models.CheckConstraint(condition=Q(expected_broadcast_hours__gte=0), name="campaign_hours_nonnegative"),
        ]
        indexes = [models.Index(fields=["status", "start_date", "end_date"])]

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.budget < 0: raise ValidationError({"budget": "Budget cannot be negative."})
        if self.start_date and self.end_date and self.end_date < self.start_date: raise ValidationError({"end_date": "End date must be on or after start date."})


class CampaignParticipation(models.Model):
    class Status(models.TextChoices):
        APPLIED = "APPLIED", "Applied"
        ACCEPTED = "ACCEPTED", "Accepted"
        ACTIVE = "ACTIVE", "Active"
        COMPLETED = "COMPLETED", "Completed"
        WITHDRAWN = "WITHDRAWN", "Withdrawn"
        REJECTED = "REJECTED", "Rejected"

    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name="participations")
    driver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="campaign_participations", limit_choices_to={"role": "DRIVER"})
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.APPLIED, db_index=True)
    is_current = models.BooleanField(default=False, db_index=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(fields=["campaign", "driver"], name="unique_campaign_driver_participation"),
            models.UniqueConstraint(fields=["driver"], condition=Q(is_current=True), name="one_current_campaign_per_driver"),
        ]
        indexes = [models.Index(fields=["campaign", "status"]), models.Index(fields=["driver", "status"])]


class BroadcastSession(models.Model):
    class MeasurementStatus(models.TextChoices):
        DEMO = "DEMO", "Demo data"
        ESTIMATED = "ESTIMATED", "Estimated"
        VERIFIED = "VERIFIED", "Verified"

    participation = models.ForeignKey(CampaignParticipation, on_delete=models.CASCADE, related_name="broadcast_sessions")
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    impressions = models.PositiveBigIntegerField(null=True, blank=True)
    measurement_status = models.CharField(max_length=12, choices=MeasurementStatus.choices, default=MeasurementStatus.ESTIMATED, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-started_at"]
        constraints = [
            models.CheckConstraint(condition=Q(ended_at__isnull=True) | Q(ended_at__gte=F("started_at")), name="broadcast_end_after_start"),
            models.UniqueConstraint(fields=["participation"], condition=Q(ended_at__isnull=True), name="one_open_broadcast_per_participation"),
        ]

    @property
    def hours(self):
        from django.utils import timezone
        end = self.ended_at or timezone.now()
        return round(max(0, (end - self.started_at).total_seconds()) / 3600, 2)
