from rest_framework import serializers
from django.conf import settings
from .models import Vehicle
from apps.core import store_upload, signed_storage_url

class VehicleSerializer(serializers.ModelSerializer):
    registration_document = serializers.FileField(write_only=True, required=False)
    registration_document_url = serializers.SerializerMethodField()
    class Meta:
        model = Vehicle
        fields = ["id", "registration_number", "vehicle_model", "vehicle_type", "registration_document", "registration_document_url", "status", "is_demo", "created_at", "updated_at"]
        read_only_fields = ["id", "status", "is_demo", "created_at", "updated_at", "registration_document_url"]
    def get_registration_document_url(self, obj): return signed_storage_url(settings.SUPABASE_DOCUMENTS_BUCKET, obj.registration_document)
    def validate_registration_number(self, value):
        qs = Vehicle.objects.filter(registration_number__iexact=value.strip())
        if self.instance: qs = qs.exclude(pk=self.instance.pk)
        if qs.exists(): raise serializers.ValidationError("A vehicle with this registration number is already listed.")
        return value.strip().upper()
    def create(self, validated):
        upload = validated.pop("registration_document", None)
        if upload: validated["registration_document"] = store_upload(upload, settings.SUPABASE_DOCUMENTS_BUCKET, private=True)
        return super().create(validated)
    def update(self, instance, validated):
        upload = validated.pop("registration_document", None)
        if upload: validated["registration_document"] = store_upload(upload, settings.SUPABASE_DOCUMENTS_BUCKET, private=True)
        return super().update(instance, validated)
