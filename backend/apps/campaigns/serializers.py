from rest_framework import serializers
from .models import Campaign

class CampaignSerializer(serializers.ModelSerializer):
    budget = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)
    class Meta:
        model = Campaign
        fields = ["id", "name", "description", "budget", "start_date", "end_date", "status", "created_at", "updated_at"]
        read_only_fields = ["id", "status", "created_at", "updated_at"]
    def validate(self, attrs):
        start = attrs.get("start_date", getattr(self.instance, "start_date", None)); end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start and end and end < start: raise serializers.ValidationError({"end_date": "End date must be on or after start date."})
        return attrs
