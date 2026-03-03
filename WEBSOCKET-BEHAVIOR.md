# WebSocket (Socket.IO) Behavior

## Overview

Realtime chat uses **Socket.IO** on the backend (NestJS `@nestjs/websockets` + `@nestjs/platform-socket.io`) and `socket.io-client` on the frontend. WebSocket is used only to **broadcast new messages** to clients viewing a channel; sending messages and loading history use **REST**.

## Current Behavior (after change: WS on separate port)

| Concern | Behavior |
|--------|----------|
| **Transport** | Socket.IO (path `/socket.io`), with transports `["websocket", "polling"]` on the client. |
| **Port** | **REST API** listens on `PORT` (default `3000`). **WebSocket server** listens on `WS_PORT` (default `3002`) to avoid sharing the HTTP server. |
| **Auth** | Client sends JWT in `auth.token` (handshake). Server verifies with `JWT_SECRET_KEY`; only `type === 'access'` and valid `userId` are accepted. Invalid/missing token → disconnect. |
| **Rooms** | Each channel is a room: `channel:<channelId>`. Client emits `join` with `{ channelId }`; server checks membership via `ChannelService.ensureUserIsMember` then `client.join('channel:' + channelId)`. |
| **Events** | **Client → Server:** `join` (payload `{ channelId }`). **Server → Client:** `message` (payload: `NewMessagePayload`). |
| **Broadcast** | When a message is created via REST (`MessageService.createMessage`), the service calls `ChatGateway.broadcastNewMessage(channelId, payload)`, which does `server.to('channel:' + channelId).emit('message', payload)`. |
| **Frontend** | `useChannelSocket({ channelId, accessToken, onMessage })` connects to `config.wsUrl` (e.g. `http://localhost:3002`), sends token, on `connect` emits `join`, and subscribes to `message`; `onMessage` is called for each new message (filtered by `channelId`). |

## Flow Summary

1. User opens channel → FE loads channel + messages via REST, connects Socket.IO to `WS_PORT` with JWT, then emits `join` with `channelId`.
2. Backend verifies JWT and membership, adds socket to room `channel:<channelId>`.
3. User sends a message → FE calls REST `POST .../messages` → backend creates message and calls `broadcastNewMessage` → all sockets in that room receive `message` event.
4. FE appends the payload to the channel’s message list (and optionally shows “connected” via `useChannelSocket`’s `connected` state).

## Configuration

- **Backend:** `PORT` (HTTP API), `WS_PORT` (Socket.IO server). Example: `PORT=3000`, `WS_PORT=3002`.
- **Frontend:** `NEXT_PUBLIC_WS_URL` must point at the **WebSocket server** (host + WS port), e.g. `http://localhost:3002`. `NEXT_PUBLIC_API_URL` stays on the API port (e.g. `http://localhost:3000/api`).
