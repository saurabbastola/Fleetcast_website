from rest_framework import serializers
from .models import ContactSubmission, PlaybookLead

class ContactSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactSubmission
        fields = ["first_name", "last_name", "email", "company", "role", "message"]
    def validate_first_name(self,value):
        value=value.strip()
        if not value: raise serializers.ValidationError("Please add your name.")
        return value

class PlaybookLeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlaybookLead
        fields = ["name", "email", "company", "source"]
