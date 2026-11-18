from unittest.mock import MagicMock, patch
from uuid import uuid4
from datetime import datetime, timezone
from datetime import timedelta
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.test import SimpleTestCase, override_settings
from django.utils import timezone as django_timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.core import signing
from django.core import mail
from .models import GoogleOAuthAttempt, User
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


@override_settings(
    GOOGLE_CLIENT_ID="test-client.apps.googleusercontent.com",
    GOOGLE_CLIENT_SECRET="test-secret",
    GOOGLE_REDIRECT_URI="https://fleetcast.example/api/v1/auth/google/callback/",
)
class GoogleOAuthStateTests(APITestCase):
    def test_start_persists_the_exact_state_sent_to_google(self):
        from urllib.parse import parse_qs, urlparse
        import hashlib
        response = self.client.get("/api/v1/auth/google/start/?role=BUSINESS")

        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        state = parse_qs(urlparse(response["Location"]).query)["state"][0]
        attempt = GoogleOAuthAttempt.objects.get()
        self.assertEqual(attempt.role, User.Role.BUSINESS)
        self.assertIsNone(attempt.link_user)
        self.assertEqual(len(attempt.state_digest), 64)
        self.assertEqual(attempt.state_digest, hashlib.sha256(state.encode("utf-8")).hexdigest())

    @patch("google.oauth2.id_token.verify_oauth2_token")
    @patch("apps.accounts.views.google_client")
    def test_callback_completes_without_a_browser_session_cookie(self, mocked_google_client, verify_token):
        from django.test import override_settings

        mocked_google_client.return_value.create_authorization_url.return_value = (
            "https://accounts.google.com/o/oauth2/v2/auth", None
        )
        mocked_google_client.return_value.fetch_token.return_value = {"id_token": "signed-id-token"}
        start = self.client.get("/api/v1/auth/google/start/?role=BUSINESS")
        state = mocked_google_client.call_args.args[0]
        attempt = GoogleOAuthAttempt.objects.get()
        verify_token.return_value = {
            "nonce": attempt.nonce,
            "email_verified": True,
            "sub": "google-subject-123",
            "email": "google-new@example.com",
            "given_name": "Google",
            "family_name": "User",
        }
        self.assertEqual(start.status_code, status.HTTP_302_FOUND)
        self.client.cookies.clear()

        with override_settings(FRONTEND_URL="https://fleetcast.example"):
            response = self.client.get("/api/v1/auth/google/callback/", {"state": state, "code": "temporary-code"})

        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertEqual(response["Location"], "https://fleetcast.example/auth/callback")
        self.assertIn("fc_access", response.cookies)
        user = User.objects.get(email="google-new@example.com")
        self.assertEqual(user.role, User.Role.BUSINESS)
        self.assertFalse(GoogleOAuthAttempt.objects.exists())

    def test_state_is_single_use_and_rejects_expired_attempts(self):
        from .views import create_google_oauth_attempt, consume_google_oauth_attempt

        state, nonce, verifier = create_google_oauth_attempt(role=User.Role.DRIVER)
        first = consume_google_oauth_attempt(state)
        self.assertEqual(first, {"nonce": nonce, "verifier": verifier, "role": User.Role.DRIVER, "link_user_id": None})
        self.assertIsNone(consume_google_oauth_attempt(state))

        expired_state, _, _ = create_google_oauth_attempt(role=User.Role.BUSINESS)
        GoogleOAuthAttempt.objects.filter().update(created_at=django_timezone.now() - timedelta(minutes=11))
        self.assertIsNone(consume_google_oauth_attempt(expired_state))

    @patch("google.oauth2.id_token.verify_oauth2_token")
    @patch("apps.accounts.views.google_client")
    def test_verified_google_user_can_add_second_workspace_without_duplicate_user(self, mocked_google_client, verify_token):
        user = User.objects.create_user(
            email="multi@example.com", password=None, role=User.Role.BUSINESS,
            auth_provider="google", provider_subject="existing-google-subject",
            is_active=True, email_verified=True,
        )
        BusinessProfile.objects.create(user=user, company_name="Existing Company")
        mocked_google_client.return_value.create_authorization_url.return_value = ("https://accounts.google.com/o/oauth2/v2/auth", None)
        mocked_google_client.return_value.fetch_token.return_value = {"id_token":"verified-token"}
        start = self.client.get("/api/v1/auth/google/start/?role=DRIVER")
        state = mocked_google_client.call_args.args[0]
        attempt = GoogleOAuthAttempt.objects.get()
        verify_token.return_value = {
            "nonce":attempt.nonce, "email_verified":True,
            "sub":"existing-google-subject", "email":"multi@example.com",
            "given_name":"Multi", "family_name":"Workspace",
        }

        with override_settings(FRONTEND_URL="https://fleetcast.example"):
            callback = self.client.get("/api/v1/auth/google/callback/", {"state":state,"code":"one-use-code"})

        self.assertEqual(start.status_code, status.HTTP_302_FOUND)
        self.assertEqual(callback.status_code, status.HTTP_302_FOUND)
        self.assertEqual(User.objects.filter(email__iexact="multi@example.com").count(), 1)
        self.assertTrue(DriverProfile.objects.filter(user=user).exists())
        self.client.cookies["fc_access"] = callback.cookies["fc_access"].value
        profile = self.client.get("/api/v1/auth/profile/")
        self.assertEqual(profile.data["role"], User.Role.DRIVER)
        self.assertEqual(set(profile.data["roles"]), {User.Role.BUSINESS, User.Role.DRIVER})

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


class MultiWorkspaceAccountTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="same-person@example.com", password="C0rrect-Horse-Battery!",
            role=User.Role.BUSINESS, is_active=True, email_verified=True,
            first_name="Same", last_name="Person",
        )
        BusinessProfile.objects.create(user=self.user, company_name="Same Person Studio")

    def test_one_email_can_add_and_switch_to_driver_workspace(self):
        login = self.client.post("/api/v1/auth/login/", {
            "email":self.user.email, "password":"C0rrect-Horse-Battery!", "role":"BUSINESS",
        }, format="json")
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertEqual(login.data["user"]["roles"], [User.Role.BUSINESS])
        self.assertEqual(self.client.get("/api/v1/business/profile/").status_code, status.HTTP_200_OK)

        added = self.client.post("/api/v1/auth/workspaces/", {"role":"DRIVER"}, format="json")
        self.assertEqual(added.status_code, status.HTTP_200_OK)
        self.assertEqual(added.data["user"]["role"], User.Role.DRIVER)
        self.assertEqual(set(added.data["user"]["roles"]), {User.Role.BUSINESS, User.Role.DRIVER})
        self.assertEqual(User.objects.filter(email__iexact="same-person@example.com").count(), 1)
        self.assertTrue(DriverProfile.objects.filter(user=self.user).exists())
        self.assertTrue(BusinessProfile.objects.filter(user=self.user).exists())
        self.assertEqual(self.client.get("/api/v1/auth/profile/").data["role"], User.Role.DRIVER)
        self.assertEqual(self.client.get("/api/v1/business/profile/").status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get("/api/v1/driver/profile/").status_code, status.HTTP_200_OK)

        switched = self.client.post("/api/v1/auth/workspaces/", {"role":"BUSINESS"}, format="json")
        self.assertEqual(switched.status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get("/api/v1/auth/profile/").data["role"], User.Role.BUSINESS)
        self.assertEqual(self.client.get("/api/v1/business/profile/").status_code, status.HTTP_200_OK)

    def test_password_login_cannot_select_a_workspace_the_user_does_not_have(self):
        response = self.client.post("/api/v1/auth/login/", {
            "email":self.user.email, "password":"C0rrect-Horse-Battery!", "role":"DRIVER",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", response.data["error"]["details"])
