import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/env';
import { getToken } from '../services/storage';

// Backend gateways (src/websocket/*.gateway.ts) live at the HTTP origin,
// not under the /api/v1 prefix — strip it back off.
const SOCKET_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, '');

/**
 * Opens a socket to one of the backend's namespaced gateways
 * (`chat.gateway.ts` -> '/chat', `tracking.gateway.ts` -> '/tracking').
 * Caller is responsible for calling `.disconnect()` (see useChatSocket /
 * useTrackingSocket) — this just handles auth + origin plumbing.
 */
export const createSocket = (namespace: 'chat' | 'tracking'): Socket => {
    return io(`${SOCKET_ORIGIN}/${namespace}`, {
        transports: ['websocket'],
        auth: { token: getToken() },
    });
};
