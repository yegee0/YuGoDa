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
 * Set to true by useAuthInit once all three onAuthStateChanged callbacks have
 * fired. After that point we know the auth state definitively — no need to
 * poll waiting for Firebase to restore a session.
 */
let _authInitialized = false;
export function markAuthInitialized(): void {
  _authInitialized = true;
}

/**
 * Aktif Firebase Auth kullanıcısından ID token alır.
 * 3 Firebase projesinden hangisinde giriş yapılmışsa onun token'ını döner.
 *
 * If all three auth instances have a null currentUser (e.g. Firebase is still
 * restoring the session from IndexedDB after a page reload), the function
 * polls up to MAX_WAIT_MS before giving up, so that callers don't silently
 * fire requests without an Authorization header during the auth-init window.
 * Once markAuthInitialized() has been called, polling is skipped entirely —
 * a null currentUser definitively means "no user signed in."
 */
async function getAuthToken(forceRefresh = false): Promise<string | null> {
  const resolveUser = () =>
    authCustomer.currentUser ||
    authPartner.currentUser ||
    authAdmin.currentUser;

  let currentUser = resolveUser();

  // Only poll during the Firebase session-restore window (before auth is
  // initialized). Once initialized, a null currentUser means "not signed in."
  if (!currentUser && !_authInitialized) {
    const MAX_WAIT_MS = 3000;
    const POLL_INTERVAL_MS = 50;
    let waited = 0;
    while (!currentUser && waited < MAX_WAIT_MS) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
      waited += POLL_INTERVAL_MS;
      currentUser = resolveUser();
    }
  }

  if (!currentUser) return null;

  try {
    return await currentUser.getIdToken(forceRefresh);
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
    // On 401, try a force-refreshed token and retry the request once.
    // This handles stale/near-expired tokens and transient auth hiccups
    // without requiring the user to log out and back in.
    if (response.status === 401 && token) {
      try {
        const freshToken = await getAuthToken(true);
        if (freshToken && freshToken !== token) {
          const retryHeaders = { ...headers, 'Authorization': `Bearer ${freshToken}` };
          const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: retryHeaders,
          });
          const retryData = await retryResponse.json();
          if (retryResponse.ok) return retryData;
          // Retry also failed — fall through to throw the retry's error
          if (retryResponse.status === 403 && retryData?.message === 'Account banned.' && bannedHandler) {
            bannedHandler();
          }
          throw new ApiError(retryData.message || `API Error: ${retryResponse.status}`, retryResponse.status);
        }
      } catch (retryErr) {
        if (retryErr instanceof ApiError) throw retryErr;
        // Network error on retry — fall through to original error
      }
    }

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
