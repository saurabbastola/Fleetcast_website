from django.contrib.auth import authenticate, password_validation
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from django.db import transaction
from .models import User, UserWorkspace

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=10)
    role = serializers.ChoiceField(choices=[("BUSINESS", "Business"), ("DRIVER", "Driver")])
    company_name = serializers.CharField(required=False, allow_blank=True, write_only=True)
    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name", "phone", "role", "company_name"]
    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("This email already has a Fleetcast account. Log in and add another workspace from Settings to keep one account for both roles.")
        return email
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
    role = serializers.ChoiceField(choices=[(User.Role.BUSINESS, "Business / Advertiser"), (User.Role.DRIVER, "Vehicle Owner / Driver")], required=False)
    def validate(self, attrs):
        user = authenticate(request=self.context.get("request"), username=attrs["email"].lower(), password=attrs["password"])
        if user is None or not user.is_active or not user.email_verified: raise serializers.ValidationError("Email or password is incorrect, or email verification is required.")
        role = User.Role.ADMIN if user.role == User.Role.ADMIN else (attrs.get("role") or user.role)
        if not UserWorkspace.objects.filter(user=user, role=role).exists():
            raise serializers.ValidationError({"role": "That workspace is not set up on this account. Sign in to your existing workspace and add it in Settings."})
        attrs["user"] = user; attrs["active_role"] = role; return attrs

class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    google_linked = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ["id", "email", "username", "first_name", "last_name", "name", "phone", "role", "roles", "is_active", "email_verified", "auth_provider", "google_linked", "created_at", "updated_at"]
        read_only_fields = ["id", "email", "username", "role", "is_active", "email_verified", "auth_provider", "google_linked", "created_at", "updated_at"]
    def get_name(self, obj): return " ".join(part for part in [obj.first_name, obj.last_name] if part) or obj.email.split("@")[0]
    def get_google_linked(self,obj): return bool(obj.provider_subject)
    def get_role(self, obj):
        request = self.context.get("request")
        if request and getattr(request.user, "pk", None) == obj.pk:
            return getattr(request.user, "active_role", obj.role)
        return self.context.get("active_role", obj.role)
    def get_roles(self, obj):
        return list(obj.workspaces.order_by("role").values_list("role", flat=True))

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["current_password"]): raise serializers.ValidationError({"current_password": "Current password is incorrect."})
        try: password_validation.validate_password(attrs["new_password"], user)
        except DjangoValidationError as exc: raise serializers.ValidationError({"new_password": list(exc.messages)})
        return attrs
