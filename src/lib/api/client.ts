const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
let csrfToken = "";
let refreshing: Promise<boolean> | null = null;

export class ApiError extends Error {
  status: number;
  details: unknown;
  constructor(message: string, status: number, details?: unknown) { super(message); this.name = "ApiError"; this.status = status; this.details = details; }
}

async function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        await ensureCsrf();
        const res = await fetch(`${API_ROOT}/auth/refresh/`, { method: "POST", credentials: "include", headers: { "X-CSRFToken": csrfToken } });
        return res.ok;
      } catch { return false; }
      finally { refreshing = null; }
    })();
  }
  return refreshing;
}

export async function ensureCsrf(): Promise<void> {
  const res = await fetch(`${API_ROOT}/auth/csrf/`, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new ApiError("Could not start a secure session. Please try again.", res.status);
  const data = await res.json(); csrfToken = data.csrfToken || "";
}

export async function api<T = any>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  if (! ["GET", "HEAD", "OPTIONS"].includes(method) && !csrfToken) await ensureCsrf();
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (! ["GET", "HEAD", "OPTIONS"].includes(method) && csrfToken) headers.set("X-CSRFToken", csrfToken);
  let response = await fetch(`${API_ROOT}${path.startsWith("/") ? path : `/${path}`}`, { ...options, method, headers, credentials: "include", cache: "no-store" });
  if (response.status === 401 && !retried && !["/auth/login/", "/auth/register/", "/auth/refresh/", "/auth/logout/", "/auth/csrf/"].includes(path)) {
    if (await refreshSession()) return api<T>(path, options, true);
  }
  let data: any = null;
  try { data = await response.json(); } catch { /* empty response */ }
  if (!response.ok) {
    const message = data?.error?.message || data?.detail || "The request could not be completed. Please try again.";
    throw new ApiError(typeof message === "string" ? message : "Please check the submitted information.", response.status, data?.error?.details || data);
  }
  return data as T;
}

export function apiUrl(path: string): string { return `${API_ROOT}${path.startsWith("/") ? path : `/${path}`}`; }
