from decimal import Decimal

from rest_framework import serializers
from apps.businesses.models import BusinessProfile

from .models import BroadcastSession, Campaign, CampaignParticipation


class CampaignSerializer(serializers.ModelSerializer):
    advertiser_name = serializers.SerializerMethodField()
    advertisement_title = serializers.CharField(source="advertisement.title", read_only=True, default="")
    advertisement_image_url = serializers.SerializerMethodField()
    service_areas = serializers.ListField(child=serializers.CharField(max_length=120), required=False)
    participation_count = serializers.SerializerMethodField()
    available_slots = serializers.SerializerMethodField()
    broadcast_hours = serializers.SerializerMethodField()
    broadcast_impressions = serializers.SerializerMethodField()
    measurement_status = serializers.SerializerMethodField()
    class Meta:
        model = Campaign
        fields = [
            "id", "advertiser_name", "advertisement", "advertisement_title", "advertisement_image_url",
            "name", "description", "industry", "advertisement_type", "budget", "start_date", "end_date",
            "available_driver_slots", "available_slots", "service_areas", "expected_broadcast_hours",
            "estimated_impressions", "compensation_rate", "requirements", "eligibility_criteria",
            "advertisement_duration_seconds", "status", "is_demo", "participation_count", "broadcast_hours", "broadcast_impressions", "measurement_status", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "status", "is_demo", "created_at", "updated_at", "advertiser_name", "advertisement_title", "advertisement_image_url", "participation_count", "available_slots", "broadcast_hours", "broadcast_impressions", "measurement_status"]
    def get_advertiser_name(self, obj):
        try: profile = obj.business.business_profile
        except BusinessProfile.DoesNotExist: profile = None
        return (profile.company_name if profile else "") or obj.business.get_full_name() or obj.business.email
    def get_advertisement_image_url(self, obj):
        if not obj.advertisement_id: return None
        from django.conf import settings
        from apps.core import signed_storage_url
        return signed_storage_url(settings.SUPABASE_ADS_BUCKET, obj.advertisement.image)
    def get_participation_count(self, obj):
        if hasattr(obj, "joined_count"): return obj.joined_count
        return obj.participations.filter(status__in=[CampaignParticipation.Status.APPLIED, CampaignParticipation.Status.ACCEPTED, CampaignParticipation.Status.ACTIVE]).count()
    def get_available_slots(self, obj):
        if obj.available_driver_slots == 0: return None
        return max(0, obj.available_driver_slots - self.get_participation_count(obj))
    def _sessions(self, obj):
        return [session for participation in obj.participations.all() for session in participation.broadcast_sessions.all()]
    def get_broadcast_hours(self, obj):
        sessions = self._sessions(obj)
        return round(sum(session.hours for session in sessions), 2) if sessions else None
    def get_broadcast_impressions(self, obj):
        values = [session.impressions for session in self._sessions(obj) if session.impressions is not None]
        return sum(values) if values else None
    def get_measurement_status(self, obj):
        statuses = {session.measurement_status for session in self._sessions(obj)}
        if not statuses: return "UNAVAILABLE"
        if BroadcastSession.MeasurementStatus.DEMO in statuses: return "DEMO"
        if statuses == {BroadcastSession.MeasurementStatus.VERIFIED}: return "VERIFIED"
        return "ESTIMATED"
    def validate_advertisement(self, advertisement):
        owner_id = self.instance.business_id if self.instance else self.context["request"].user.id
        if advertisement and advertisement.business_id != owner_id:
            raise serializers.ValidationError("Choose an advertisement owned by your business account.")
        return advertisement
    def validate_service_areas(self, value):
        if len(value) > 20: raise serializers.ValidationError("Enter no more than 20 service areas.")
        return [area.strip() for area in value if area.strip()]
    def validate(self, attrs):
        start = attrs.get("start_date", getattr(self.instance, "start_date", None)); end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start and end and end < start: raise serializers.ValidationError({"end_date": "End date must be on or after start date."})
        for field in ("budget", "compensation_rate", "expected_broadcast_hours"):
            value = attrs.get(field, getattr(self.instance, field, Decimal("0")) if self.instance else Decimal("0"))
            if value < 0: raise serializers.ValidationError({field: "This value cannot be negative."})
        return attrs


class BroadcastSessionSerializer(serializers.ModelSerializer):
    hours = serializers.FloatField(read_only=True)
    vehicle_summary = serializers.SerializerMethodField()
    class Meta:
        model = BroadcastSession
        fields = ["id", "vehicle", "vehicle_summary", "started_at", "ended_at", "hours", "impressions", "measurement_status", "created_at"]
        read_only_fields = fields
    def get_vehicle_summary(self, obj):
        vehicle = obj.vehicle
        if not vehicle: return None
        return {"id": vehicle.id, "registration_number": vehicle.registration_number, "vehicle_model": vehicle.vehicle_model, "vehicle_type": vehicle.vehicle_type}


class ParticipationSerializer(serializers.ModelSerializer):
    driver_id = serializers.UUIDField(read_only=True)
    driver_name = serializers.SerializerMethodField()
    driver_email = serializers.EmailField(source="driver.email", read_only=True)
    campaign = CampaignSerializer(read_only=True)
    hours = serializers.SerializerMethodField()
    impressions = serializers.SerializerMethodField()
    estimated_earnings = serializers.SerializerMethodField()
    measurement_status = serializers.SerializerMethodField()
    open_session = serializers.SerializerMethodField()
    broadcast_sessions = serializers.SerializerMethodField()
    vehicle_summary = serializers.SerializerMethodField()
    class Meta:
        model = CampaignParticipation
        fields = ["id", "campaign", "driver_id", "driver_name", "driver_email", "status", "is_current", "applied_at", "updated_at", "hours", "impressions", "estimated_earnings", "measurement_status", "open_session", "broadcast_sessions", "vehicle", "vehicle_summary"]
        read_only_fields = fields
    def get_driver_name(self, obj):
        return obj.driver.get_full_name() or obj.driver.email.split("@", 1)[0]
    def _sessions(self, obj):
        return list(obj.broadcast_sessions.all())
    def get_hours(self, obj): return round(sum(s.hours for s in self._sessions(obj)), 2)
    def get_impressions(self, obj):
        sessions = self._sessions(obj)
        values = [s.impressions for s in sessions if s.impressions is not None]
        return sum(values) if values else None
    def get_estimated_earnings(self, obj):
        return round(Decimal(str(self.get_hours(obj))) * obj.campaign.compensation_rate, 2)
    def get_measurement_status(self, obj):
        statuses = {s.measurement_status for s in self._sessions(obj)}
        if not statuses: return "UNAVAILABLE"
        if BroadcastSession.MeasurementStatus.DEMO in statuses: return "DEMO"
        if BroadcastSession.MeasurementStatus.VERIFIED in statuses and statuses == {BroadcastSession.MeasurementStatus.VERIFIED}: return "VERIFIED"
        return "ESTIMATED"
    def get_open_session(self, obj):
        session = next((s for s in self._sessions(obj) if s.ended_at is None), None)
        return BroadcastSessionSerializer(session).data if session else None
    def get_broadcast_sessions(self, obj):
        return BroadcastSessionSerializer(self._sessions(obj), many=True).data
    def get_vehicle_summary(self, obj):
        vehicle = obj.vehicle
        if not vehicle: return None
        return {"id": vehicle.id, "registration_number": vehicle.registration_number, "vehicle_model": vehicle.vehicle_model, "vehicle_type": vehicle.vehicle_type, "status": vehicle.status}
