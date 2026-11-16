import uuid
from datetime import timedelta
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone

class UserManager(BaseUserManager):
    use_in_migrations = True
    def create_user(self, email, password=None, **extra_fields):
        if not email: raise ValueError("An email address is required")
        user = self.model(email=self.normalize_email(email).strip().lower(), **extra_fields)
        user.set_password(password); user.save(using=self._db); return user
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", User.Role.ADMIN); extra_fields.setdefault("is_staff", True); extra_fields.setdefault("is_superuser", True); extra_fields.setdefault("email_verified", True)
        if extra_fields.get("is_staff") is not True or extra_fields.get("is_superuser") is not True: raise ValueError("Superusers require staff and superuser flags")
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Administrator"
        BUSINESS = "BUSINESS", "Business"
        DRIVER = "DRIVER", "Driver"
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True, blank=True)
    email = models.EmailField(unique=True, db_index=True)
    phone = models.CharField(max_length=32, blank=True)
    role = models.CharField(max_length=12, choices=Role.choices, default=Role.BUSINESS, db_index=True)
    email_verified = models.BooleanField(default=False, db_index=True)
    auth_provider = models.CharField(max_length=20, default="password")
    provider_subject = models.CharField(max_length=255, blank=True, null=True, unique=True)
    legacy_supabase_user_id = models.UUIDField(blank=True, null=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = UserManager()
    def save(self, *args, **kwargs):
        if not self.username: self.username = self.email
        super().save(*args, **kwargs)


class GoogleOAuthAttempt(models.Model):
    """Short-lived server-side OAuth state, independent of browser session cookies."""
    state_digest = models.CharField(max_length=64, primary_key=True)
    nonce = models.CharField(max_length=128)
    code_verifier = models.CharField(max_length=128)
    role = models.CharField(max_length=12, blank=True)
    link_user = models.ForeignKey(
        "accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    @classmethod
    def expiry_cutoff(cls):
        return timezone.now() - timedelta(minutes=10)
