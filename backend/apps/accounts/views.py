import secrets
from django.db import transaction
from authlib.integrations.requests_client import OAuth2Session
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.db import connection
from django.core.mail import send_mail
from django.core import signing
from django.http import JsonResponse, HttpResponseRedirect
from django.middleware.csrf import get_token
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, ChangePasswordSerializer

ACCESS_COOKIE = "fc_access"
REFRESH_COOKIE = "fc_refresh"

def set_tokens(response, refresh):
    common = {"httponly": True, "secure": settings.COOKIE_SECURE, "samesite": settings.COOKIE_SAMESITE, "path": "/"}
    response.set_cookie(ACCESS_COOKIE, str(refresh.access_token), max_age=600, **common)
    response.set_cookie(REFRESH_COOKIE, str(refresh), max_age=7 * 86400, **common)
    return response

def clear_tokens(response):
    for name in (ACCESS_COOKIE, REFRESH_COOKIE):
        response.delete_cookie(name, path="/", samesite=settings.COOKIE_SAMESITE)
    return response

def revoke_user_refresh_tokens(user):
    from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
    for token in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=token)

@ensure_csrf_cookie
def csrf_cookie(request):
    return JsonResponse({"csrfToken": get_token(request)})

@method_decorator(csrf_protect, name="dispatch")
class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"
    def post(self, request):
        serializer = RegisterSerializer(data=request.data); serializer.is_valid(raise_exception=True)
        user = serializer.save()
        uid = urlsafe_base64_encode(force_bytes(user.pk)); token = signing.dumps(str(user.pk), salt="fleetcast.email-verification")
        link = f"{settings.FRONTEND_URL}/verify-email#uid={uid}&token={token}"
        try: send_mail("Verify your Fleetcast email", f"Confirm your email to activate your account: {link}", settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
        except Exception:
            import logging
            logging.getLogger(__name__).warning("Verification email delivery failed")
        return Response({"verification_required": True, "detail": "Check your email for a link to verify your account."}, status=status.HTTP_201_CREATED)

@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request}); serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        return set_tokens(Response({"user": UserSerializer(user).data}), RefreshToken.for_user(user))

@method_decorator(csrf_protect, name="dispatch")
class RefreshView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def post(self, request):
        raw = request.COOKIES.get(REFRESH_COOKIE)
        if not raw: return clear_tokens(Response({"error": {"message": "Session expired. Please sign in again."}}, status=401))
        try:
            refresh = RefreshToken(raw); user = get_user_model().objects.get(pk=refresh["user_id"], is_active=True)
            if settings.SIMPLE_JWT.get("ROTATE_REFRESH_TOKENS"):
                try: refresh.blacklist()
                except AttributeError: pass
                refresh = RefreshToken.for_user(user)
            response = Response({"user": UserSerializer(user).data})
            return set_tokens(response, refresh)
        except Exception:
            return clear_tokens(Response({"error": {"message": "Session expired. Please sign in again."}}, status=401))

@method_decorator(csrf_protect, name="dispatch")
class LogoutView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def post(self, request):
        raw = request.COOKIES.get(REFRESH_COOKIE)
        if raw:
            try: RefreshToken(raw).blacklist()
            except TokenError: pass
        return clear_tokens(Response({"detail": "Signed out."}))

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request): return Response(UserSerializer(request.user).data)
    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True); serializer.is_valid(raise_exception=True); serializer.save(); return Response(serializer.data)

@method_decorator(csrf_protect, name="dispatch")
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request}); serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"]); request.user.save(update_fields=["password", "updated_at"]); revoke_user_refresh_tokens(request.user)
        return clear_tokens(Response({"detail": "Password updated. Please sign in again."}))

@method_decorator(csrf_protect, name="dispatch")
class ForgotPasswordView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "email"
    def post(self, request):
        email = str(request.data.get("email", "")).strip().lower(); user = User.objects.filter(email=email, is_active=True, email_verified=True).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk)); token = default_token_generator.make_token(user)
            link = f"{settings.FRONTEND_URL}/reset-password#uid={uid}&token={token}"
            try: send_mail("Reset your Fleetcast password", f"Use this link to reset your password: {link}", settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
            except Exception:
                import logging
                logging.getLogger(__name__).warning("Password reset email delivery failed")
        return Response({"detail": "If an account matches that address, password reset instructions have been sent."})

@method_decorator(csrf_protect, name="dispatch")
class ResetPasswordView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def post(self, request):
        try:
            user_id = force_str(urlsafe_base64_decode(request.data["uid"])); user = User.objects.get(pk=user_id, is_active=True, email_verified=True)
        except Exception: return Response({"error": {"message": "This reset link is invalid or expired."}}, status=400)
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError
        if not default_token_generator.check_token(user, request.data.get("token", "")): return Response({"error": {"message": "This reset link is invalid or expired."}}, status=400)
        try: validate_password(request.data.get("password", ""), user)
        except ValidationError as exc: return Response({"error": {"message": " ".join(exc.messages)}}, status=400)
        user.set_password(request.data["password"]); user.save(update_fields=["password", "updated_at"]); revoke_user_refresh_tokens(user)
        return Response({"detail": "Password reset. You can now sign in."})

class VerifyEmailView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def post(self, request):
        try:
            user_id = force_str(urlsafe_base64_decode(request.data["uid"]))
            signed_id = signing.loads(request.data["token"], salt="fleetcast.email-verification", max_age=86400)
            if str(signed_id) != str(user_id): raise ValueError("identity mismatch")
            user = User.objects.get(pk=user_id)
        except Exception:
            return Response({"error": {"message": "This verification link is invalid or expired."}}, status=400)
        if user.email_verified: return Response({"error": {"message": "This email has already been verified. Please sign in."}}, status=400)
        user.is_active = True; user.email_verified = True; user.save(update_fields=["is_active", "email_verified", "updated_at"])
        response = Response({"user": UserSerializer(user).data})
        return set_tokens(response, RefreshToken.for_user(user))

class ResendVerificationView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "email"
    def post(self, request):
        email = str(request.data.get("email", "")).strip().lower(); user = User.objects.filter(email=email, is_active=False).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk)); token = signing.dumps(str(user.pk), salt="fleetcast.email-verification")
            link = f"{settings.FRONTEND_URL}/verify-email#uid={uid}&token={token}"
            try: send_mail("Verify your Fleetcast email", f"Confirm your email to activate your account: {link}", settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
            except Exception:
                import logging
                logging.getLogger(__name__).warning("Verification email delivery failed")
        return Response({"detail": "If the account needs verification, a new link has been sent."})

class AdminUserList(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        from .permissions import IsAdminRole
        if not IsAdminRole().has_permission(request, self): return Response({"error": {"message": "Administrator access required."}}, status=403)
        qs = User.objects.all().order_by("-created_at")
        role = request.query_params.get("role")
        if role in User.Role.values: qs = qs.filter(role=role)
        term = request.query_params.get("search")
        if term: qs = qs.filter(email__icontains=term)
        from django.core.paginator import Paginator
        page = Paginator(qs, 25).get_page(request.query_params.get("page"))
        return Response({"count": qs.count(), "next": page.next_page_number() if page.has_next() else None, "previous": page.previous_page_number() if page.has_previous() else None, "results": UserSerializer(page.object_list, many=True).data})

class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        from .permissions import IsAdminRole
        if not IsAdminRole().has_permission(request, self): return Response({"error": {"message": "Administrator access required."}}, status=403)
        from apps.businesses.models import BusinessProfile
        from apps.drivers.models import DriverProfile
        from apps.vehicles.models import Vehicle
        from apps.advertisements.models import Advertisement
        from apps.campaigns.models import Campaign
        return Response({"users": User.objects.count(), "businesses": BusinessProfile.objects.count(), "drivers": DriverProfile.objects.count(), "vehicles": Vehicle.objects.count(), "advertisements": Advertisement.objects.count(), "campaigns": Campaign.objects.count(), "impressions": None, "revenue": None})

def google_client(state=None):
    return OAuth2Session(settings.GOOGLE_CLIENT_ID, settings.GOOGLE_CLIENT_SECRET, scope="openid email profile", redirect_uri=settings.GOOGLE_REDIRECT_URI, state=state, code_challenge_method="S256")

def find_legacy_google_user(subject, email):
    """Return (legacy UUID, email already belongs to Supabase) without email-only linking."""
    if connection.vendor != "postgresql":
        return None, False
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT u.id, u.email, u.email_confirmed_at, u.deleted_at
            FROM auth.identities AS i
            JOIN auth.users AS u ON u.id = i.user_id
            WHERE i.provider = 'google'
              AND i.provider_id = %s
            """,
            [subject],
        )
        row = cursor.fetchone()
        if row:
            legacy_id, legacy_email, email_confirmed_at, deleted_at = row
            matches = (legacy_email or "").lower() == email.lower()
            if matches and email_confirmed_at and not deleted_at:
                return legacy_id, True
            return None, True

        cursor.execute(
            "SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER(%s) AND deleted_at IS NULL LIMIT 1",
            [email],
        )
        return None, bool(cursor.fetchone())

class GoogleStartView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def get(self, request):
        role = request.query_params.get("role", "")
        if role not in (User.Role.BUSINESS, User.Role.DRIVER): return Response({"error": {"message": "Choose Business or Driver before continuing."}}, status=400)
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET or not settings.GOOGLE_REDIRECT_URI: return Response({"error": {"message": "Google sign-in is not configured on the server."}}, status=503)
        state = secrets.token_urlsafe(32); nonce = secrets.token_urlsafe(32); verifier = secrets.token_urlsafe(64)
        request.session["google_oauth_state"] = state; request.session["google_oauth_nonce"] = nonce; request.session["google_oauth_verifier"] = verifier; request.session["google_signup_role"] = role
        uri, _ = google_client(state).create_authorization_url("https://accounts.google.com/o/oauth2/v2/auth", access_type="online", prompt="select_account", nonce=nonce, code_verifier=verifier)
        return HttpResponseRedirect(uri)

@method_decorator(csrf_protect, name="dispatch")
class GoogleLinkStartView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET or not settings.GOOGLE_REDIRECT_URI:
            return Response({"error": {"message": "Google sign-in is not configured on the server."}}, status=503)
        if not request.user.email_verified: return Response({"error": {"message": "Verify your email before linking Google."}}, status=403)
        state = secrets.token_urlsafe(32); nonce = secrets.token_urlsafe(32); verifier = secrets.token_urlsafe(64)
        request.session["google_oauth_state"] = state; request.session["google_oauth_nonce"] = nonce
        request.session["google_oauth_verifier"] = verifier; request.session["google_link_user_id"] = str(request.user.pk)
        uri, _ = google_client(state).create_authorization_url("https://accounts.google.com/o/oauth2/v2/auth", access_type="online", prompt="select_account", nonce=nonce, code_verifier=verifier)
        return Response({"authorization_url": uri})

class GoogleCallbackView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def get(self, request):
        state = request.session.pop("google_oauth_state", None); nonce = request.session.pop("google_oauth_nonce", None); verifier = request.session.pop("google_oauth_verifier", None); role = request.session.pop("google_signup_role", None); link_user_id = request.session.pop("google_link_user_id", None)
        if not state or not secrets.compare_digest(state, request.query_params.get("state", "")):
            return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?auth_error=oauth_state")
        try:
            client = google_client(state); token = client.fetch_token("https://oauth2.googleapis.com/token", code=request.query_params.get("code"), grant_type="authorization_code", code_verifier=verifier)
            from google.auth.transport.requests import Request as GoogleRequest
            from google.oauth2 import id_token
            claims = id_token.verify_oauth2_token(token["id_token"], GoogleRequest(), settings.GOOGLE_CLIENT_ID)
            if claims.get("nonce") != nonce or claims.get("email_verified") is not True or not claims.get("sub") or not claims.get("email"):
                return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?auth_error=google_unverified")
            if link_user_id:
                try: target = User.objects.get(pk=link_user_id, is_active=True)
                except User.DoesNotExist: return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?auth_error=account_link_required")
                if claims["email"].lower() != target.email.lower(): return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?auth_error=link_email_mismatch")
                if User.objects.filter(provider_subject=claims["sub"]).exclude(pk=target.pk).exists(): return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?auth_error=identity_already_linked")
                if target.provider_subject and target.provider_subject != claims["sub"]: return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?auth_error=identity_already_linked")
                target.provider_subject = claims["sub"]; target.email_verified = True; target.save(update_fields=["provider_subject", "email_verified", "updated_at"])
                return set_tokens(HttpResponseRedirect(f"{settings.FRONTEND_URL}/auth/callback?linked=1"), RefreshToken.for_user(target))
            user = User.objects.filter(provider_subject=claims["sub"]).first()
            if user is None:
                if role not in (User.Role.BUSINESS, User.Role.DRIVER): return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?auth_error=role_required")
                from apps.businesses.models import BusinessProfile
                from apps.drivers.models import DriverProfile
                legacy_user_id, legacy_email_exists = find_legacy_google_user(claims["sub"], claims["email"])
                if legacy_email_exists and not legacy_user_id:
                    return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?auth_error=account_link_required")
                legacy_user = User.objects.filter(legacy_supabase_user_id=legacy_user_id).first() if legacy_user_id else None
                if User.objects.filter(email__iexact=claims["email"]).exists() and not legacy_user:
                    return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?auth_error=account_link_required")
                with transaction.atomic():
                    user = legacy_user
                    if user:
                        if user.email.lower() != claims["email"].lower() or (user.provider_subject and user.provider_subject != claims["sub"]):
                            return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?auth_error=account_link_required")
                        user.provider_subject = claims["sub"]
                        user.email_verified = True
                        user.save(update_fields=["provider_subject", "email_verified", "updated_at"])
                    else:
                        user = User.objects.create_user(email=claims["email"], password=None, first_name=claims.get("given_name", ""), last_name=claims.get("family_name", ""), role=role, auth_provider="google", provider_subject=claims["sub"], legacy_supabase_user_id=legacy_user_id, is_active=True, email_verified=True)
                        if role == User.Role.BUSINESS: BusinessProfile.objects.create(user=user, company_name="")
                        else: DriverProfile.objects.create(user=user)
            if not user.is_active: return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?auth_error=inactive")
            if not user.email_verified: return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?auth_error=unverified")
            return set_tokens(HttpResponseRedirect(f"{settings.FRONTEND_URL}/auth/callback"), RefreshToken.for_user(user))
        except Exception:
            return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?auth_error=google_failed")
