from rest_framework import serializers
from .models import DriverProfile
from apps.core import store_upload, signed_storage_url
from django.conf import settings

class DriverProfileSerializer(serializers.ModelSerializer):
    profile_photo = serializers.FileField(write_only=True, required=False)
    profile_photo_url = serializers.SerializerMethodField()
    class Meta:
        model = DriverProfile
        fields = ["id", "address", "license_number", "profile_photo", "profile_photo_url", "verification_status", "created_at", "updated_at"]
        read_only_fields = ["id", "verification_status", "created_at", "updated_at", "profile_photo_url"]
    def get_profile_photo_url(self, obj): return signed_storage_url(settings.SUPABASE_ADS_BUCKET, obj.profile_photo)
    def update(self, instance, validated):
        upload = validated.pop("profile_photo", None)
        if upload: validated["profile_photo"] = store_upload(upload, settings.SUPABASE_ADS_BUCKET)
        return super().update(instance, validated)
