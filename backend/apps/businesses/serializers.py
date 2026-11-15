from rest_framework import serializers
from .models import BusinessProfile
from apps.core import store_upload, signed_storage_url
from django.conf import settings

class BusinessProfileSerializer(serializers.ModelSerializer):
    company_logo = serializers.FileField(write_only=True, required=False)
    company_logo_url = serializers.SerializerMethodField()
    class Meta:
        model = BusinessProfile
        fields = ["id", "company_name", "business_address", "website", "description", "company_logo", "company_logo_url", "verification_status", "created_at", "updated_at"]
        read_only_fields = ["id", "verification_status", "created_at", "updated_at", "company_logo_url"]
    def get_company_logo_url(self, obj): return signed_storage_url(settings.SUPABASE_ADS_BUCKET, obj.company_logo)
    def update(self, instance, validated):
        upload = validated.pop("company_logo", None)
        if upload: validated["company_logo"] = store_upload(upload, settings.SUPABASE_ADS_BUCKET)
        return super().update(instance, validated)
