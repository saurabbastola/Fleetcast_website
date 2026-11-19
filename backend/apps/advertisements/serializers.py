from rest_framework import serializers
from django.conf import settings
from .models import Advertisement
from apps.core import store_upload, signed_storage_url

class AdvertisementSerializer(serializers.ModelSerializer):
    image = serializers.FileField(write_only=True, required=False)
    image_url = serializers.SerializerMethodField()
    class Meta:
        model = Advertisement
        fields = ["id", "title", "description", "image", "image_url", "status", "is_demo", "created_at", "updated_at"]
        read_only_fields = ["id", "status", "is_demo", "created_at", "updated_at", "image_url"]
    def get_image_url(self, obj): return signed_storage_url(settings.SUPABASE_ADS_BUCKET, obj.image)
    def create(self, validated):
        upload = validated.pop("image", None)
        if upload: validated["image"] = store_upload(upload, settings.SUPABASE_ADS_BUCKET)
        return super().create(validated)
    def update(self, instance, validated):
        upload = validated.pop("image", None)
        if upload: validated["image"] = store_upload(upload, settings.SUPABASE_ADS_BUCKET)
        return super().update(instance, validated)
