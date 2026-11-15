from unittest.mock import MagicMock, patch
from uuid import uuid4
from datetime import datetime, timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.test import SimpleTestCase, override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.core import signing
from django.core import mail
from .models import User
from apps.businesses.models import BusinessProfile
from apps.drivers.models import DriverProfile
from apps.campaigns.models import Campaign


class LegacyGoogleIdentityTests(SimpleTestCase):
    @override_settings(DATABASE_URL="postgresql://example.invalid/database")
    @patch("apps.accounts.views.connection")
    def test_legacy_account_requires_exact_confirmed_google_identity_and_email(self, connection):
        from .views import find_legacy_google_user

        legacy_id = uuid4()
        connection.vendor = "postgresql"
        cursor = MagicMock()
        connection.cursor.return_value.__enter__.return_value = cursor
        cursor.fetchone.return_value = (legacy_id, "verified@example.com", datetime.now(timezone.utc), None)

        result = find_legacy_google_user("google-subject", "verified@example.com")

        self.assertEqual(result, (legacy_id, True))
        query, params = cursor.execute.call_args.args
        self.assertIn("i.provider_id = %s", query)
        self.assertEqual(params, ["google-subject"])

    @override_settings(DATABASE_URL="postgresql://example.invalid/database")
    @patch("apps.accounts.views.connection")
    def test_email_only_supabase_account_requires_manual_linking(self, connection):
        from .views import find_legacy_google_user

        connection.vendor = "postgresql"
        cursor = MagicMock()
        connection.cursor.return_value.__enter__.return_value = cursor
        cursor.fetchone.side_effect = [None, (1,)]

        self.assertEqual(find_legacy_google_user("unlinked-google-subject", "legacy@example.com"), (None, True))

    @patch("apps.accounts.views.connection")
    def test_sqlite_never_tries_to_read_supabase_auth_schema(self, connection):
        from .views import find_legacy_google_user

        connection.vendor = "sqlite"
        self.assertEqual(find_legacy_google_user("google-subject", "verified@example.com"), (None, False))
        connection.cursor.assert_not_called()

@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class AuthenticationApiTests(APITestCase):
    def test_business_registration_hashes_password_and_sets_jwt_cookies(self):
        response = self.client.post("/api/v1/auth/register/", {"email":"buyer@example.com", "password":"C0rrect-Horse-Battery!", "first_name":"Ari", "last_name":"Buyer", "role":"BUSINESS", "company_name":"Ari Studio"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="buyer@example.com")
        self.assertTrue(user.check_password("C0rrect-Horse-Battery!"))
        self.assertNotEqual(user.password, "C0rrect-Horse-Battery!")
        self.assertFalse(user.is_active)
        self.assertFalse(user.email_verified)
        self.assertEqual(BusinessProfile.objects.get(user=user).company_name, "Ari Studio")
        self.assertNotIn("fc_access", response.cookies)
        self.assertIn("Verify your Fleetcast email", mail.outbox[0].subject)

    def test_verification_activates_account_and_establishes_session(self):
        user=User.objects.create_user(email="verify@example.com",password="C0rrect-Horse-Battery!",role=User.Role.DRIVER,is_active=False)
        uid=urlsafe_base64_encode(force_bytes(user.pk));token=signing.dumps(str(user.pk),salt="fleetcast.email-verification")
        response=self.client.post("/api/v1/auth/verify-email/",{"uid":uid,"token":token},format="json")
        self.assertEqual(response.status_code,status.HTTP_200_OK)
        user.refresh_from_db();self.assertTrue(user.is_active);self.assertTrue(user.email_verified)
        self.assertIn("fc_access",response.cookies)
        self.assertTrue(response.cookies["fc_access"]["httponly"])

    def test_admin_role_is_not_publicly_registerable(self):
        response = self.client.post("/api/v1/auth/register/", {"email":"root@example.com", "password":"C0rrect-Horse-Battery!", "role":"ADMIN", "company_name":""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email="root@example.com").exists())

    def test_driver_registration_creates_driver_profile(self):
        response = self.client.post("/api/v1/auth/register/", {"email":"driver@example.com", "password":"C0rrect-Horse-Battery!", "first_name":"Dee", "role":"DRIVER"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(DriverProfile.objects.filter(user__email="driver@example.com").exists())

    def test_login_and_profile_use_cookie_auth(self):
        user = User.objects.create_user(email="member@example.com", password="C0rrect-Horse-Battery!", role=User.Role.DRIVER, email_verified=True)
        response = self.client.post("/api/v1/auth/login/", {"email":user.email, "password":"C0rrect-Horse-Battery!"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.cookies["fc_access"] = response.cookies["fc_access"].value
        profile = self.client.get("/api/v1/auth/profile/")
        self.assertEqual(profile.status_code, status.HTTP_200_OK)
        self.assertEqual(profile.data["role"], "DRIVER")

    def test_login_requires_csrf_token(self):
        User.objects.create_user(email="csrf@example.com", password="C0rrect-Horse-Battery!", role=User.Role.BUSINESS, email_verified=True)
        client = APIClient(enforce_csrf_checks=True)
        client.get("/api/v1/auth/csrf/")
        denied = client.post("/api/v1/auth/login/", {"email":"csrf@example.com", "password":"C0rrect-Horse-Battery!"}, format="json")
        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)
        token = client.cookies["csrftoken"].value
        accepted = client.post("/api/v1/auth/login/", {"email":"csrf@example.com", "password":"C0rrect-Horse-Battery!"}, format="json", HTTP_X_CSRFTOKEN=token)
        self.assertEqual(accepted.status_code, status.HTTP_200_OK)

class RoleAccessTests(APITestCase):
    def setUp(self):
        self.business = User.objects.create_user(email="business@example.com", password="C0rrect-Horse-Battery!", role=User.Role.BUSINESS)
        self.other = User.objects.create_user(email="other@example.com", password="C0rrect-Horse-Battery!", role=User.Role.BUSINESS)
        self.driver = User.objects.create_user(email="driver@example.com", password="C0rrect-Horse-Battery!", role=User.Role.DRIVER)
        self.admin = User.objects.create_superuser(email="admin@example.com", password="C0rrect-Horse-Battery!")
        self.mine = Campaign.objects.create(business=self.business, name="My campaign", budget=100)
        Campaign.objects.create(business=self.other, name="Other campaign", budget=200)

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_business_campaigns_are_scoped_to_the_authenticated_owner(self):
        self.authenticate(self.business)
        response = self.client.get("/api/v1/campaigns/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["name"] for item in response.data["results"]], ["My campaign"])
        self.assertEqual(self.client.get(f"/api/v1/campaigns/{Campaign.objects.filter(business=self.other).first().id}/").status_code, status.HTTP_404_NOT_FOUND)

    def test_driver_cannot_access_business_campaigns(self):
        self.authenticate(self.driver)
        response = self.client.get("/api/v1/campaigns/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_business_cannot_access_admin_dashboard(self):
        self.authenticate(self.business)
        response = self.client.get("/api/v1/admin/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_access_admin_dashboard(self):
        self.authenticate(self.admin)
        response = self.client.get("/api/v1/admin/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["campaigns"], 2)
