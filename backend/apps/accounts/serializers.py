from django.contrib.auth import authenticate, password_validation
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from django.db import transaction
from .models import User

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=10)
    role = serializers.ChoiceField(choices=[("BUSINESS", "Business"), ("DRIVER", "Driver")])
    company_name = serializers.CharField(required=False, allow_blank=True, write_only=True)
    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name", "phone", "role", "company_name"]
    def validate_email(self, value): return value.strip().lower()
    def validate(self, attrs):
        if attrs["role"] == User.Role.BUSINESS and not attrs.get("company_name", "").strip():
            raise serializers.ValidationError({"company_name": "Company name is required for business accounts."})
        try: validate_password(attrs["password"])
        except DjangoValidationError as exc: raise serializers.ValidationError({"password": list(exc.messages)})
        return attrs
    @transaction.atomic
    def create(self, validated):
        from apps.businesses.models import BusinessProfile
        from apps.drivers.models import DriverProfile
        password = validated.pop("password"); role = validated.pop("role"); company = validated.pop("company_name", "")
        user = User.objects.create_user(password=password, role=role, is_active=False, email_verified=False, **validated)
        if role == User.Role.BUSINESS: BusinessProfile.objects.create(user=user, company_name=company)
        else: DriverProfile.objects.create(user=user)
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    def validate(self, attrs):
        user = authenticate(request=self.context.get("request"), username=attrs["email"].lower(), password=attrs["password"])
        if user is None or not user.is_active or not user.email_verified: raise serializers.ValidationError("Email or password is incorrect, or email verification is required.")
        attrs["user"] = user; return attrs

class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    google_linked = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ["id", "email", "username", "first_name", "last_name", "name", "phone", "role", "is_active", "email_verified", "auth_provider", "google_linked", "created_at", "updated_at"]
        read_only_fields = ["id", "email", "username", "role", "is_active", "email_verified", "auth_provider", "google_linked", "created_at", "updated_at"]
    def get_name(self, obj): return " ".join(part for part in [obj.first_name, obj.last_name] if part) or obj.email.split("@")[0]
    def get_google_linked(self,obj): return bool(obj.provider_subject)

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["current_password"]): raise serializers.ValidationError({"current_password": "Current password is incorrect."})
        try: password_validation.validate_password(attrs["new_password"], user)
        except DjangoValidationError as exc: raise serializers.ValidationError({"new_password": list(exc.messages)})
        return attrs
