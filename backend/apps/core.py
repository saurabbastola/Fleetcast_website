import mimetypes
import uuid
from urllib.parse import quote
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from django.conf import settings
from rest_framework.exceptions import ValidationError

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "application/pdf"}

def store_upload(upload, bucket, private=False):
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise ValidationError("File storage is not configured on the server.")
    if upload.size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise ValidationError(f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB} MB limit.")
    claimed_mime = upload.content_type or mimetypes.guess_type(upload.name)[0]
    allowed = ALLOWED_MIME if bucket == settings.SUPABASE_DOCUMENTS_BUCKET else ALLOWED_MIME - {"application/pdf"}
    if claimed_mime not in allowed:
        raise ValidationError("Upload a JPG, PNG, WebP image, or PDF document.")
    upload.seek(0)
    if claimed_mime == "application/pdf":
        actual_mime = "application/pdf" if upload.read(5) == b"%PDF-" else None
    else:
        try:
            from PIL import Image
            image = Image.open(upload); image.verify()
            actual_mime = {"JPEG":"image/jpeg","PNG":"image/png","WEBP":"image/webp"}.get(image.format)
        except Exception:
            actual_mime = None
    upload.seek(0)
    if actual_mime != claimed_mime:
        raise ValidationError("The uploaded file content does not match its declared image or document type.")
    safe_name = upload.name.rsplit("/", 1)[-1].rsplit("\\", 1)[-1].replace("..", "_")
    key = f"{uuid.uuid4().hex}-{safe_name}"
    endpoint = f"{settings.SUPABASE_URL}/storage/v1/object/{bucket}/{quote(key, safe='')}"
    req = Request(endpoint, data=upload.read(), headers={"Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}", "apikey": settings.SUPABASE_SERVICE_ROLE_KEY, "Content-Type": claimed_mime, "x-upsert": "false"}, method="POST")
    try:
        with urlopen(req, timeout=30) as response:
            if response.status not in (200, 201): raise ValidationError("The file could not be stored.")
    except (HTTPError, URLError, TimeoutError) as exc:
        raise ValidationError("The file could not be stored. Please try again.") from exc
    return key

def signed_storage_url(bucket, key, expires=300):
    if not key: return None
    req = Request(f"{settings.SUPABASE_URL}/storage/v1/object/sign/{bucket}/{key}", data=(__import__("json").dumps({"expiresIn": expires})).encode(), headers={"Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}", "apikey": settings.SUPABASE_SERVICE_ROLE_KEY, "Content-Type": "application/json"}, method="POST")
    try:
        with urlopen(req, timeout=10) as response:
            data = __import__("json").loads(response.read())
        return f"{settings.SUPABASE_URL}/storage/v1{data['signedURL']}"
    except Exception:
        return None
