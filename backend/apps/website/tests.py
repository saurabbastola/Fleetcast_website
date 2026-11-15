from io import BytesIO
from unittest.mock import MagicMock, patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings
from PIL import Image


class HealthEndpointTests(SimpleTestCase):
    def test_health_endpoint_does_not_require_authentication_or_database(self):
        response = self.client.get("/api/v1/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})


class StorageUploadTests(SimpleTestCase):
    @override_settings(
        SUPABASE_URL="https://storage.example.test",
        SUPABASE_SERVICE_ROLE_KEY="test-service-role-key",
        SUPABASE_DOCUMENTS_BUCKET="documents",
        MAX_UPLOAD_SIZE_MB=10,
    )
    @patch("apps.core.urlopen")
    def test_upload_sends_the_validated_mime_type(self, urlopen):
        from apps.core import store_upload

        image = Image.new("RGB", (1, 1), "white")
        image_bytes = BytesIO()
        image.save(image_bytes, format="PNG")
        upload = SimpleUploadedFile("pixel.png", image_bytes.getvalue(), content_type="image/png")
        response = MagicMock()
        response.status = 201
        response.__enter__.return_value = response
        urlopen.return_value = response

        key = store_upload(upload, "advertisements")

        self.assertTrue(key.endswith("-pixel.png"))
        request = urlopen.call_args.args[0]
        self.assertEqual(request.get_header("Content-type"), "image/png")
