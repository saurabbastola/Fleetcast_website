from django.core.exceptions import ValidationError
from django.db import transaction

from .models import User, UserWorkspace


@transaction.atomic
def ensure_workspace(user, role, *, company_name=""):
    """Provision one allowed business/driver workspace on an already verified user."""
    if role not in (User.Role.BUSINESS, User.Role.DRIVER):
        raise ValidationError("Choose Business / Advertiser or Vehicle Owner / Driver.")

    UserWorkspace.objects.get_or_create(user=user, role=role)
    if role == User.Role.BUSINESS:
        from apps.businesses.models import BusinessProfile
        BusinessProfile.objects.get_or_create(user=user, defaults={"company_name": company_name.strip()})
    else:
        from apps.drivers.models import DriverProfile
        DriverProfile.objects.get_or_create(user=user)
    return user
