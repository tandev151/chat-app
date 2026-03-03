# Hiện trạng Backend – Chat App (chat/be)

## 1. Tổng quan công nghệ

| Hạng mục        | Công nghệ / Phiên bản |
|-----------------|------------------------|
| Framework       | NestJS 11              |
| ORM             | Prisma 7 (PostgreSQL)  |
| Auth            | JWT (@nestjs/jwt), bcrypt, passport (chưa dùng strategy/guard) |
| Validation      | class-validator, class-transformer |
| API docs        | Swagger (@nestjs/swagger) |
| Package manager | pnpm                  |

- **Prefix API:** `/api`
- **Swagger UI:** `/api/docs`
- **CORS:** `origin: http://localhost:5173`, `credentials: true`
- **ValidationPipe:** `whitelist`, `forbidNonWhitelisted`, `transform`

---

## 2. Cấu trúc thư mục chính

```
src/
├── auth/          # Đăng nhập, refresh token (chưa có register endpoint, chưa có JWT guard/strategy)
├── user/          # Tạo user (POST /users) – dùng như “register”
├── channel/       # Module rỗng (chưa implement)
├── message/       # Module rỗng (chưa implement)
└── friend-ship/   # Module rỗng (chưa implement), schema + migration đã có
```

---

## 3. Database (Prisma)

### 3.1 Các model hiện có

- **User:** id, email (unique), passwordHash, displayName, createdAt, updatedAt  
  Quan hệ: messages, channels (createdBy), friendshipRequestsSent/Received, channelMembers.

- **Channel:** id, name, description?, createdById. Quan hệ: messages, channelMembers.  
  Chưa có: `type` (PUBLIC/PRIVATE) như trong lesson 05.

- **Message:** id, content, channelId, userId, createdAt.

- **ChannelMember:** id, channelId, userId, joinedAt; `@@unique([channelId, userId])`.  
  Chưa có: `role` (ADMIN/MEMBER) như trong lesson 05.

- **FriendShipRequest:** id, requestUserId, addresseeId, status (PENDING | ACCEPTED | REJECTED | CANCELLED | EXPIRED), createdAt, respondedAt.  
  `@@unique([requestUserId, addresseeId])`.

**Lưu ý:** File `prisma/schema.prisma` có dòng thừa/cụt ở cuối (dòng 100: `model ` không có tên model) – nên xóa hoặc bổ sung cho đúng.

### 3.2 Migrations đã chạy

- `20260210081724_init` – init DB
- `20260212161818_add_friendship_models` – bảng + enum FriendShipRequest

---

## 4. Auth & User (đã làm)

- **POST /api/auth/login**  
  Body: email, password → trả về accessToken (15 phút), refreshToken (1 giờ), type: bearer.

- **POST /api/auth/refresh-token**  
  Body: refreshToken → trả về cặp token mới.

- **POST /api/users**  
  Body: email, password, displayName → tạo user (hash password), trả về success (boolean).  
  Thực tế đang đóng vai “register”; không có endpoint register riêng trong Auth.

- **Chưa có:**  
  - JwtStrategy / PassportStrategy  
  - JwtAuthGuard (hoặc AuthGuard('jwt'))  
  - Decorator @CurrentUser()  
  - Endpoint register trong Auth (nếu muốn tách rõ register vs user CRUD)

---

## 5. Các module chưa implement

| Module      | Trạng thái | Ghi chú |
|------------|------------|--------|
| Channel    | Chỉ có module rỗng | Cần: CRUD channel, members, invite, (optional) type/role trong schema |
| Message    | Chỉ có module rỗng | Cần: gửi tin, lấy tin (có phân trang), (sau) WebSocket |
| FriendShip | Chỉ có module rỗng | Schema + migration sẵn; cần: send request, accept/reject, list friends/requests, guard |

---

## 6. Tài liệu nội bộ (lesson/)

- 01: Prisma 7 + NestJS setup  
- 02: Auth module step-by-step  
- 03: Auth review (access/refresh, Guard vs Middleware)  
- 04: Refresh token flow review  
- 05: **Social platform architecture** – Friendship, Channel, Message, API design, data model, thứ tự triển khai  
- 06: **Friendship** – Send request & Accept request (validation, edge cases, authorization, checklist)

---

## 7. Kết luận ngắn

- **Đã có:** NestJS + Prisma 7, Auth (login + refresh), tạo user (POST /users), Swagger, ValidationPipe, schema + migration cho User, Channel, Message, ChannelMember, FriendShipRequest.
- **Chưa có:** JWT guard/strategy và @CurrentUser(); register trong Auth; toàn bộ logic Friendship (send/accept/reject/list); toàn bộ Channel (CRUD, members, invite); toàn bộ Message (gửi/lấy, realtime); Notification (optional); chuẩn response format (data/meta/message) và pagination thống nhất.

Tiếp theo có thể dựa trên **CURRENT-BACKGROUND.md** này và **CHECKLIST-PHAT-TRIEN.md** để phát triển từng bước mà không cần implement ngay trong bước review.
