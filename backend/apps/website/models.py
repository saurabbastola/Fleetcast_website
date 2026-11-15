"""Unmanaged mappings for the existing lead tables; no schema migration is created."""
import uuid
from django.db import models

class ContactSubmission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    first_name = models.CharField(max_length=100)
    last_name = models.TextField(null=True, blank=True)
    email = models.EmailField(max_length=200)
    company = models.TextField(null=True, blank=True)
    role = models.TextField(null=True, blank=True)
    message = models.TextField(null=True, blank=True)
    class Meta: managed = False; db_table = "contact_submissions"

class PlaybookLead(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=120, null=True, blank=True)
    email = models.EmailField(max_length=200)
    company = models.CharField(max_length=200, null=True, blank=True)
    source = models.CharField(max_length=60, default="website")
    class Meta: managed = False; db_table = "playbook_leads"
