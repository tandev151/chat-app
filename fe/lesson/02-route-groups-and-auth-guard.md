# Lesson: Route groups and auth guard

## What we built

- **Route groups**: `(auth)` for login/register, `(dashboard)` for the main app. URL paths are unchanged (`/login`, `/register`, `/`).
- **Auth guard**: The `(dashboard)` layout is a client component that checks `isAuthenticated` and `isReady` from `useAuth()`. If not ready, it shows loading. If ready and not authenticated, it redirects to `/login`. Public routes like `/login` and `/register` render without the dashboard layout (no sidebar).

## Patterns

### 1. Route groups in App Router

- Folders wrapped in parentheses, e.g. `(auth)` and `(dashboard)`, do **not** appear in the URL.
- `app/(auth)/login/page.tsx` → `/login`.
- `app/(dashboard)/page.tsx` → `/`.
- Each group can have its own `layout.tsx` so login has a centered card layout and the dashboard has sidebar + main.

### 2. Client-side auth guard

- Auth state (token, user) lives in React context and is only available on the client.
- The guard runs in a **client** layout: `"use client"` + `useEffect` that calls `router.replace("/login")` when `isReady && !isAuthenticated`.
- We avoid flashing protected content by showing “Loading…” until `isReady` is true (initial refresh check has finished).

### 3. Public vs protected paths

- We keep a list of public paths (e.g. `["/login", "/register"]`). If the current path is in that list, we render `children` only (no sidebar, no guard redirect).
- So the same root layout can wrap both public and protected routes; the dashboard layout is only applied to protected routes under `(dashboard)`.

## Takeaway

Use route groups to get different layouts for different sections without changing URLs. Use a client layout and `useAuth()` to guard protected routes and redirect unauthenticated users to login.
