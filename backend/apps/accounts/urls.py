from django.urls import path
from .views import csrf_cookie, RegisterView, LoginView, RefreshView, LogoutView, ProfileView, WorkspaceView, ChangePasswordView, ForgotPasswordView, ResetPasswordView, VerifyEmailView, ResendVerificationView, GoogleStartView, GoogleLinkStartView, GoogleCallbackView, AdminUserList, AdminDashboardView

urlpatterns = [
    path("auth/csrf/", csrf_cookie), path("auth/register/", RegisterView.as_view()), path("auth/login/", LoginView.as_view()),
    path("auth/refresh/", RefreshView.as_view()), path("auth/logout/", LogoutView.as_view()),
    path("auth/profile/", ProfileView.as_view()), path("auth/workspaces/", WorkspaceView.as_view()), path("auth/change-password/", ChangePasswordView.as_view()),
    path("auth/forgot-password/", ForgotPasswordView.as_view()), path("auth/reset-password/", ResetPasswordView.as_view()),
    path("auth/verify-email/", VerifyEmailView.as_view()), path("auth/resend-verification/", ResendVerificationView.as_view()),
    path("auth/google/start/", GoogleStartView.as_view()), path("auth/google/link/start/", GoogleLinkStartView.as_view()), path("auth/google/callback/", GoogleCallbackView.as_view()),
    path("admin/users/", AdminUserList.as_view()), path("admin/dashboard/", AdminDashboardView.as_view()),
]
