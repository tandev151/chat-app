/**
 * Single constant key for the HTTP header that carries the access token.
 * Use this everywhere the token is attached to requests (e.g. axios interceptors).
 */
export const AUTH_HEADER_KEY = "Authorization" as const;

/**
 * Prefix for the header value. Backend expects: "Bearer <accessToken>"
 */
export const AUTH_HEADER_BEARER_PREFIX = "Bearer " as const;

export const getAuthHeaderValue = (accessToken: string): string =>
  `${AUTH_HEADER_BEARER_PREFIX}${accessToken}`;

/**
 * Access token is NOT stored in localStorage/sessionStorage.
 * It is kept only in memory (Zustand auth store: auth-store.ts, state.accessToken).
 * So there is no storage key constant for access token—by design (short-lived, security).
 */

/** localStorage key for refresh token only. Access token is in memory (Zustand). */
export const REFRESH_TOKEN_STORAGE_KEY = "chat_refresh_token" as const;
