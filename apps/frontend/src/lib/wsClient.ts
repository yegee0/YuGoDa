/**
 * WebSocket / STOMP client factory
 * ----------------------------------
 * Creates authenticated STOMP clients for real-time chat messaging.
 *
 * Backend endpoint : /ws  (native WebSocket, no SockJS)
 * Dev URL  : ws://localhost:4000/ws
 * Prod URL : wss://backend-service-ey66bgcneq-ew.a.run.app/ws
 */

import { Client } from '@stomp/stompjs';
import { authCustomer, authPartner, authAdmin } from './firebase';

// Derive WebSocket URL from the same env var that api.ts uses
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
export const WS_BROKER_URL = API_BASE
  .replace(/^https/, 'wss')
  .replace(/^http/, 'ws')
  .replace(/\/api\/?$/, '') + '/ws';

async function getFirebaseToken(): Promise<string | null> {
  const user =
    authCustomer.currentUser ||
    authPartner.currentUser ||
    authAdmin.currentUser;
  return user ? user.getIdToken() : null;
}

/**
 * Creates a new STOMP client pointed at the backend WebSocket endpoint.
 * Automatically fetches (and refreshes) the Firebase auth token on every
 * connect/reconnect attempt via `beforeConnect`.
 *
 * Usage:
 *   const client = createStompClient();
 *   client.onConnect = () => { client.subscribe('/topic/chat.xxx', cb); };
 *   client.activate();
 *   // on cleanup:
 *   client.deactivate();
 */
export function createStompClient(): Client {
  const client = new Client({
    brokerURL: WS_BROKER_URL,
    reconnectDelay: 5000,
    beforeConnect: async () => {
      const token = await getFirebaseToken();
      client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    },
  });
  return client;
}
