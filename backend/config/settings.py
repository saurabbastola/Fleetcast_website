"""Django settings. Database migrations are intentionally not shipped/applied."""
import os
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
SECRET_KEY = os.getenv("SECRET_KEY", "insecure-development-key-change-me")
DEBUG = os.getenv("DEBUG", "False").lower() in {"1", "true", "yes"}
FLEETCAST_DEMO_MODE = os.getenv("FLEETCAST_DEMO_MODE", "False").lower() in {"1", "true", "yes"}
DEVELOPER_EMAIL = os.getenv("DEVELOPER_EMAIL", "saurabbanstola5@gmail.com").strip().lower()
ALLOWED_HOSTS = [v.strip() for v in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if v.strip()]
RENDER_EXTERNAL_HOSTNAME = os.getenv("RENDER_EXTERNAL_HOSTNAME", "")
if RENDER_EXTERNAL_HOSTNAME and RENDER_EXTERNAL_HOSTNAME not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

INSTALLED_APPS = [
    "django.contrib.admin", "django.contrib.auth", "django.contrib.contenttypes",
    "django.contrib.sessions", "django.contrib.messages", "django.contrib.staticfiles",
    "corsheaders", "rest_framework", "rest_framework_simplejwt.token_blacklist",
    "apps.accounts", "apps.businesses", "apps.drivers", "apps.vehicles",
    "apps.advertisements", "apps.campaigns", "apps.payments", "apps.notifications", "apps.website",
]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware", "whitenoise.middleware.WhiteNoiseMiddleware", "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware", "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware", "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware", "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
ROOT_URLCONF = "config.urls"
TEMPLATES = [{"BACKEND": "django.template.backends.django.DjangoTemplates", "DIRS": [], "APP_DIRS": True,
              "OPTIONS": {"context_processors": ["django.template.context_processors.request", "django.contrib.auth.context_processors.auth", "django.contrib.messages.context_processors.messages"]}}]
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"
DATABASE_URL = os.getenv("DATABASE_URL", "")
if os.getenv("DJANGO_REQUIRE_DATABASE", "False").lower() in {"1", "true", "yes"} and not DATABASE_URL:
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured("DATABASE_URL must be set for this deployment; SQLite fallback is disabled.")
DATABASES = {"default": dj_database_url.parse(DATABASE_URL, conn_max_age=60, ssl_require=not DEBUG) if DATABASE_URL else {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "development-local.sqlite3"}}
AUTH_USER_MODEL = "accounts.User"
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
]
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
CORS_ALLOWED_ORIGINS = [v.strip() for v in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",") if v.strip()]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = [v.strip() for v in os.getenv("CSRF_TRUSTED_ORIGINS", "http://localhost:3000").split(",") if v.strip()]
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["apps.accounts.authentication.CookieJWTAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 25,
    "DEFAULT_THROTTLE_RATES": {"anon": "30/minute", "user": "300/minute", "contact": "5/minute", "lead": "5/minute", "register": "5/hour", "email": "5/minute"},
    "DEFAULT_FILTER_BACKENDS": ["rest_framework.filters.SearchFilter", "rest_framework.filters.OrderingFilter", "django_filters.rest_framework.DjangoFilterBackend"],
    "EXCEPTION_HANDLER": "apps.accounts.errors.api_exception_handler",
}
SIMPLE_JWT = {"ACCESS_TOKEN_LIFETIME": __import__("datetime").timedelta(minutes=10), "REFRESH_TOKEN_LIFETIME": __import__("datetime").timedelta(days=7), "ROTATE_REFRESH_TOKENS": True, "BLACKLIST_AFTER_ROTATION": True, "AUTH_HEADER_TYPES": ("Bearer",)}
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "False").lower() in {"1", "true", "yes"}
COOKIE_SAMESITE = "None" if COOKIE_SECURE else "Lax"
SESSION_COOKIE_SECURE = COOKIE_SECURE
SESSION_COOKIE_SAMESITE = COOKIE_SAMESITE
CSRF_COOKIE_SECURE = COOKIE_SECURE
CSRF_COOKIE_SAMESITE = COOKIE_SAMESITE
CSRF_COOKIE_HTTPONLY = False
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ADS_BUCKET = os.getenv("SUPABASE_ADS_BUCKET", "advertisements")
SUPABASE_DOCUMENTS_BUCKET = os.getenv("SUPABASE_DOCUMENTS_BUCKET", "documents")
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = os.getenv("EMAIL_HOST", "")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True").lower() in {"1", "true", "yes"}
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "Fleetcast <no-reply@example.com>")
PASSWORD_RESET_TIMEOUT = 86400
