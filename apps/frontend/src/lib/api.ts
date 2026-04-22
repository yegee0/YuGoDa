/**
 * API İstemcisi
 * -------------
 * Backend API ile iletişimi merkezi olarak yöneten yardımcı fonksiyonlar.
 * Firebase Auth token'ını otomatik olarak Authorization header'ına ekler.
 */

import { authCustomer, authPartner, authAdmin } from './firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

/**
 * Registered by a top-level app effect to force-logout + redirect when the
 * backend rejects with "Account banned." Decoupled from this module so we
 * don't pull `firebase.signOut` and router navigation into the fetch layer.
 * Callers register a callback at startup; undefined means "not yet wired."
 */
let bannedHandler: (() => void) | null = null;
export function setBannedHandler(handler: (() => void) | null): void {
  bannedHandler = handler;
}

/**
 * Error thrown by `apiFetch` when the backend returns a non-2xx response.
 * Callers that need to branch on status (e.g. 404 vs 500) can `instanceof`
 * check and read `.status`. Pure network failures (DNS, offline, abort)
 * still throw a plain `TypeError` from `fetch`, NOT an `ApiError` — use
 * `err instanceof ApiError` to distinguish "backend responded with error"
 * from "couldn't reach backend."
 */
export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Aktif Firebase Auth kullanıcısından ID token alır.
 * 3 Firebase projesinden hangisinde giriş yapılmışsa onun token'ını döner.
 */
async function getAuthToken(): Promise<string | null> {
  // Sırasıyla tüm Firebase Auth instance'larını kontrol et
  const currentUser =
    authCustomer.currentUser ||
    authPartner.currentUser ||
    authAdmin.currentUser;

  if (!currentUser) return null;

  try {
    return await currentUser.getIdToken();
  } catch {
    return null;
  }
}

/**
 * API isteği gönderir.
 *
 * @param endpoint - API endpoint'i (örn: "/bags", "/users/me")
 * @param options  - fetch ayarları (method, body, vb.)
 * @returns API yanıtı (JSON)
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // Banned users' Firebase session stays valid client-side, but the backend
    // rejects every call with 403 + "Account banned." Force a hard logout so
    // no banned user lingers in the authed UI.
    if (response.status === 403 && data?.message === 'Account banned.' && bannedHandler) {
      bannedHandler();
    }
    throw new ApiError(data.message || `API Error: ${response.status}`, response.status);
  }

  return data;
}

// ─────────────────────────────────────────────
// Kısayol Fonksiyonlar
// ─────────────────────────────────────────────

export const api = {
  get: <T = any>(endpoint: string) =>
    apiFetch<T>(endpoint, { method: 'GET' }),

  post: <T = any>(endpoint: string, body?: unknown) =>
    apiFetch<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(endpoint: string, body?: unknown) =>
    apiFetch<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(endpoint: string, body?: unknown) =>
    apiFetch<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string) =>
    apiFetch<T>(endpoint, { method: 'DELETE' }),
};
