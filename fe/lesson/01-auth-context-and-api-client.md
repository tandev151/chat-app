# Lesson: Auth context and API client

## What we built

- **AuthProvider** holds access token (in memory), refresh token (in localStorage), and user info decoded from JWT.
- **API client** (axios) uses callbacks so the auth context can supply the current token and handle 401 (refresh then retry or redirect to login).

## Patterns

### 1. Token storage

- **Access token**: kept in a React ref + state so every request can attach it, and we don’t persist it (shorter-lived).
- **Refresh token**: stored in `localStorage` so after a full reload we can call refresh and get a new access token without asking the user to log in again.

### 2. Setting auth on the API client

The API client is created at module load, but auth (token + refresh) lives in React. So we use **setters**:

- `setAuthCallbacks({ getAccessToken, onUnauthorized })` is called from `AuthProvider` in a `useEffect`.
- Request interceptor calls `getAccessToken()` and adds `Authorization: Bearer <token>`.
- Response interceptor: on 401, calls `onUnauthorized()` (e.g. refresh); if a new token is returned, retries the failed request with the new token.

### 3. Skipping retry for refresh endpoint

If the **refresh** request returns 401, we must not run the same 401 logic again (infinite loop). So we detect the refresh URL (e.g. `url.includes('refresh-token')`) and do not retry in that case.

### 4. Bootstrapping on load

On mount, `AuthProvider` checks for a stored refresh token. If present, it calls the refresh API once. If that succeeds, we set the new tokens and the user is “logged in” without visiting the login page. If it fails, we clear tokens and (optionally) redirect to `/login`.

## Takeaway

Auth state and API client are separate: the client gets “how to read the token” and “what to do on 401” via callbacks, so the same client works with any auth implementation (context, zustand, etc.).
