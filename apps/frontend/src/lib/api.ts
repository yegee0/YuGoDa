/**
 * API İstemcisi
 * -------------
 * Backend API ile iletişimi merkezi olarak yöneten yardımcı fonksiyonlar.
 * Firebase Auth token'ını otomatik olarak Authorization header'ına ekler.
 */

import { authCustomer, authPartner, authAdmin } from './firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

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
    throw new Error(data.message || `API Error: ${response.status}`);
  }

  return data;
}

// ─────────────────────────────────────────────
// Kısayol Fonksiyonlar
// ─────────────────────────────────────────────

export const api = {
  get: <T = any>(endpoint: string) =>
    apiFetch<T>(endpoint, { method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any) =>
    apiFetch<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(endpoint: string, body?: any) =>
    apiFetch<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string) =>
    apiFetch<T>(endpoint, { method: 'DELETE' }),
};
