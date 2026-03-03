# Frontend screens and API plan (from backend controllers)

This document maps each backend controller and endpoint to client-side screens and sections. It serves as the single source of truth for what the FE implements and what the BE already provides.

---

## Backend API summary

| Module   | Method | Endpoint                  | Auth  | Purpose                    |
|----------|--------|---------------------------|-------|----------------------------|
| Auth     | POST   | `/api/auth/login`         | No    | Login; returns JWT pair    |
| Auth     | POST   | `/api/auth/refresh-token` | No    | Refresh access token       |
| Users    | POST   | `/api/users`              | No    | Register (create user)     |
| Friend   | POST   | `/api/friend/add`         | JWT   | Send friend request        |
| Friend   | POST   | `/api/friend/confirm`     | JWT   | Accept/reject request      |
| Channel  | -      | (not implemented yet)     | -     | Plan: GET/POST channels   |
| Message  | -      | (not implemented yet)     | -     | Plan: GET messages, etc.  |

---

## 1. Auth flow

### 1.1 Login screen

- **Route:** `/login`
- **API:** `POST /api/auth/login`
- **Body:** `{ email: string, password: string }`
- **Response:** `{ accessToken, expiresIn, refreshToken, type: 'bearer' }`
- **Behaviour:**
  - On success: store tokens (e.g. in memory + refreshToken in httpOnly or secure storage), redirect to app home.
  - On 401: show error (e.g. "Email or password is incorrect").
  - Link to Register page.

### 1.2 Register screen

- **Route:** `/register`
- **API:** `POST /api/users`
- **Body:** `{ email: string, password: string, displayName: string }`
  - Password: 8–32 chars, at least one upper, one lower, one number, one special.
  - displayName: 2–50 chars.
- **Response:** `true` on success (201).
- **Behaviour:**
  - On success: redirect to Login (or auto-login if BE adds login response later).
  - On 400: show validation errors from BE.
  - Link to Login page.

### 1.3 Token refresh

- **API:** `POST /api/auth/refresh-token`
- **Body:** `{ refreshToken: string }`
- **Response:** Same shape as login (new accessToken + refreshToken).
- **Usage:** Called when accessToken expires (e.g. 401 from any API). If refresh fails, redirect to `/login`.

---

## 2. Authenticated app layout

- **Route:** `/` (and nested routes under a layout).
- **Guard:** If no valid access token (and refresh fails), redirect to `/login`.
- **Layout structure (aligned with plan):**
  - **Sidebar:** Channel list (placeholder until Channel API exists), Friends section (see below), Create channel button (placeholder).
  - **Main area:** Header (channel name or "Select a channel"), Message list (placeholder), Message input (placeholder).

---

## 3. Friends section (from Friend controller)

### 3.1 Add friend

- **API:** `POST /api/friend/add`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Body:** `{ addresseeId: string }` (UUID of user to add).
- **Behaviour:**
  - UI: input for "User ID" (or "Email" when BE exposes user search) and "Send request" button.
  - Success: toast/message "Friend request sent".
  - 400: show message (e.g. "Cannot add yourself", "User not found", "Friend request already exists").

### 3.2 Confirm friend (accept / reject)

- **API:** `POST /api/friend/confirm`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Body:** `{ friendRequestId: string, status: 'accepted' | 'rejected' }`
  - Note: In current BE, `friendRequestId` is the **requester’s user ID**, not the request record ID.
- **Behaviour:**
  - UI: list of pending requests (when BE provides `GET /api/friend/requests` or similar). Until then: simple form "Requester user ID" + Accept / Reject.
  - Success: update local state / refetch list; show feedback.

### 3.3 Gaps (for BE or later FE)

- No `GET /friend/requests` (pending received requests) → cannot show a full "Incoming requests" list without new endpoint.
- No "list my friends" endpoint → friends list is placeholder until BE adds it.

---

## 4. Channels and messages (planned, not in BE yet)

- **Channels:** Plan is `GET /channels`, `POST /channels`, `GET /channels/:id/messages` (see plan doc).
- **Messages:** Realtime via Socket.IO (joinChannel, sendMessage, messageCreated, userJoined, userLeft).
- **FE for now:** Placeholder UI (sidebar channel list, main message area) and clear labels like "Channels (coming soon)" so that when BE and gateway are ready, we only wire API and socket.

---

## 5. Screen list summary

| # | Screen / Section      | Route / Location   | Main APIs / behaviour                    |
|---|------------------------|--------------------|------------------------------------------|
| 1 | Login                  | `/login`           | POST /auth/login                         |
| 2 | Register               | `/register`        | POST /users                              |
| 3 | App layout             | `/`                | Guard + refresh token                    |
| 4 | Sidebar – Friends      | Sidebar            | POST /friend/add, POST /friend/confirm   |
| 5 | Sidebar – Channels     | Sidebar            | Placeholder (no API yet)                 |
| 6 | Main – Header          | Main               | Channel name or placeholder              |
| 7 | Main – Message list    | Main               | Placeholder                              |
| 8 | Main – Message input   | Main               | Placeholder                              |

---

## 6. Environment

- **API base URL:** `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:3000/api`). Backend runs on port 3000 with global prefix `api`. FE dev server runs on port **3001**; ensure backend CORS allows `http://localhost:3001`.
