from django.middleware.csrf import CsrfViewMiddleware
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(BaseAuthentication):
    """Read access JWT from HttpOnly cookie and enforce CSRF on unsafe requests."""
    def authenticate(self, request):
        raw = request.COOKIES.get("fc_access")
        if not raw: return None
        try:
            validated = JWTAuthentication().get_validated_token(raw)
            user = JWTAuthentication().get_user(validated)
        except Exception as exc:
            raise AuthenticationFailed("Your session has expired. Please sign in again.") from exc
        if request.method not in ("GET", "HEAD", "OPTIONS", "TRACE"):
            check = CsrfViewMiddleware(lambda req: None).process_view(request, None, (), {})
            if check: raise AuthenticationFailed("CSRF verification failed. Refresh the page and try again.")
        return user, validated
