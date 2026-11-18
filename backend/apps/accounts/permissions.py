from rest_framework.permissions import BasePermission

class IsAdminRole(BasePermission):
    def has_permission(self, request, view): return bool(request.user and request.user.is_authenticated and getattr(request.user, "active_role", request.user.role) == "ADMIN")

class IsBusinessRole(BasePermission):
    def has_permission(self, request, view): return bool(request.user and request.user.is_authenticated and getattr(request.user, "active_role", request.user.role) == "BUSINESS")

class IsDriverRole(BasePermission):
    def has_permission(self, request, view): return bool(request.user and request.user.is_authenticated and getattr(request.user, "active_role", request.user.role) == "DRIVER")

class IsAdminOrSelf(BasePermission):
    def has_object_permission(self, request, view, obj): return getattr(request.user, "active_role", request.user.role) == "ADMIN" or getattr(obj, "user_id", None) == request.user.id
