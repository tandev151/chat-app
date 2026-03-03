# Social Platform – Standard Architecture Design

## 1. Tổng quan

Tài liệu thiết kế kiến trúc chuẩn cho nền tảng social với các tính năng:
- **Friendship** – thêm bạn bè, quản lý danh sách
- **Channel** – tạo channel, mời thành viên, chat nhóm
- **Message** – đã có sẵn

---

## 2. Kiến trúc gợi ý

### 2.1 Domain-driven Module Structure

```
src/
├── auth/           # Xác thực: login, register, refresh
├── user/           # CRUD user, profile, search
├── friend/         # Friendship: gửi lời mời, chấp nhận, danh sách bạn
├── channel/        # Channel: tạo, cập nhật, mời member, list
├── message/        # Message: gửi, lấy, realtime (WebSocket)
├── notification/   # (optional) Thông báo: friend request, channel invite
└── common/         # (optional) Shared: guards, decorators, filters
```

**Nguyên tắc:** Mỗi domain = 1 module, tách biệt responsibility.

---

### 2.2 Luồng chính (Core Flows)

#### Flow 1: Add Friend

```
User A                    API                         User B
   |                        |                             |
   |  POST /friends/request |                             |
   |  { targetUserId }      |                             |
   |----------------------->|                             |
   |                        |  Tạo FriendshipRequest      |
   |                        |  status: PENDING            |
   |                        |  (hoặc gửi notification)    |
   |  201 Created           |                             |
   |<-----------------------|                             |
   |                        |                             |
   |                        |  User B xem request         |
   |                        |  GET /friends/requests      |
   |                        |<----------------------------|
   |                        |                             |
   |                        |  User B chấp nhận           |
   |                        |  POST /friends/accept       |
   |                        |  { requestId }              |
   |                        |---------------------------->|
   |                        |  Cập nhật status: ACCEPTED  |
   |                        |  Tạo Friendship (2 chiều)   |
   |                        |                             |
   |  GET /friends          |                             |
   |  → Danh sách bạn bè    |                             |
```

**Trạng thái Friendship Request:**
- `PENDING` – chờ phản hồi
- `ACCEPTED` – đã chấp nhận
- `REJECTED` – từ chối
- `BLOCKED` – (optional) chặn

#### Flow 2: Create Channel

```
User (creator)             API
   |                         |
   |  POST /channels         |
   |  { name, description }  |
   |------------------------>|
   |                         |  Tạo Channel
   |                         |  Tạo ChannelMember (creator = ADMIN)
   |  201 Created            |
   |<------------------------|
   |                         |
   |  POST /channels/:id/invite
   |  { userIds: [...] }     |
   |------------------------>|
   |                         |  Tạo ChannelMember cho từng user
   |                         |  (optional: gửi notification)
   |  200 OK                 |
   |<------------------------|
```

---

## 3. Data Model Design

### 3.1 Friendship (Thêm mới)

Hai cách thiết kế phổ biến:

**Option A: FriendshipRequest + Friendship (2 bảng)**

```
FriendshipRequest          Friendship
- id                       - id
- requesterId (User)       - userId
- addresseeId (User)       - friendId
- status (PENDING/...)     - createdAt
- createdAt                @@unique([userId, friendId])
- respondedAt              
```

- `FriendshipRequest`: lưu lời mời, status
- `Friendship`: khi ACCEPTED, tạo 2 bản ghi (A→B và B→A) hoặc 1 bản ghi (bidirectional)

**Option B: Chỉ Friendship với status**

```
Friendship
- id
- userId
- friendId
- status (PENDING, ACCEPTED, BLOCKED)
- createdAt
- respondedAt
@@unique([userId, friendId])
```

- Đơn giản hơn, 1 bảng xử lý cả request và friend
- Gửi lời mời: tạo 1 record PENDING (requester = userId, addressee = friendId)
- Chấp nhận: đổi status → ACCEPTED, có thể tạo thêm record ngược (friendId → userId) nếu cần symmetric

**Gợi ý:** Option A rõ ràng hơn về luồng; Option B đơn giản hơn. Có thể bắt đầu với Option B, sau mở rộng thêm Request nếu cần.

### 3.2 Channel (Mở rộng hiện tại)

Bổ sung:

- **Channel.type**: `PUBLIC` | `PRIVATE` (public: ai cũng join được, private: cần invite)
- **ChannelMember.role**: `ADMIN` | `MEMBER` (admin: mời/xóa member, đổi setting)
- **ChannelInvitation** (optional): bảng lời mời vào channel, tương tự friend request

### 3.3 Sơ đồ quan hệ (tóm tắt)

```
User
 ├── Friendship[] (as userId)
 ├── Friendship[] (as friendId)
 ├── FriendshipRequest[] (requester/addressee)
 ├── Channel[] (createdBy)
 ├── ChannelMember[]
 └── Message[]

Channel
 ├── ChannelMember[]
 ├── Message[]
 └── (optional) ChannelInvitation[]
```

---

## 4. API Design chuẩn

### 4.1 RESTful naming

| Resource | POST | GET | PATCH/PUT | DELETE |
|----------|------|-----|-----------|--------|
| `/friends` | Gửi lời mời | Danh sách bạn | - | Hủy kết bạn |
| `/friends/requests` | - | Lời mời đang chờ | Accept/Reject | Hủy lời mời |
| `/channels` | Tạo channel | List channels | - | - |
| `/channels/:id` | - | Chi tiết channel | Cập nhật | Xóa |
| `/channels/:id/members` | Mời member | Danh sách member | Đổi role | Xóa member |
| `/channels/:id/messages` | Gửi message | Lấy messages | - | - |

### 4.2 Response format thống nhất

```json
{
  "data": { ... },
  "meta": { "total": 10, "page": 1, "limit": 20 },
  "message": "Success"
}
```

Hoặc đơn giản: trả trực tiếp `data`, không wrap (tùy chuẩn team).

### 4.3 Pagination

- Query: `?page=1&limit=20` hoặc `?cursor=xxx&limit=20`
- Cursor-based phù hợp feed, danh sách tin nhắn; offset phù hợp danh sách bạn, channel.

---

## 5. Authorization & Guards

### 5.1 Rule cơ bản

| Action | Rule |
|--------|------|
| Gửi friend request | Chỉ user đăng nhập |
| Chấp nhận/Reject | Chỉ addressee của request |
| Xem danh sách bạn | Chỉ chính user đó |
| Tạo channel | Chỉ user đăng nhập |
| Mời member vào channel | Chỉ ADMIN/Owner |
| Xóa member | Chỉ ADMIN/Owner |
| Gửi message | Chỉ member của channel |
| Xem messages | Chỉ member của channel |

### 5.2 Cách implement

- **JwtAuthGuard**: verify token, gắn `request.user`
- **Resource Guard**: kiểm tra quyền với resource (vd: `ChannelMemberGuard` – user có phải member/admin không)
- **Custom decorator**: `@CurrentUser()`, `@Roles('ADMIN')`

---

## 6. Thứ tự triển khai gợi ý

1. **Friendship**
   - Schema: `Friendship` (hoặc `FriendshipRequest` + `Friendship`)
   - FriendModule: service, controller
   - Endpoints: request, accept, reject, list friends, list requests
   - Guard: JwtAuthGuard cho tất cả

2. **Channel (mở rộng)**
   - Schema: thêm `type`, `role` cho ChannelMember
   - ChannelService: create, invite members, list
   - ChannelMemberGuard: kiểm tra membership/role

3. **Message (mở rộng)**
   - Pagination cho GET messages
   - WebSocket cho realtime (nếu cần)

4. **Notification (optional)**
   - Bảng Notification
   - Gửi notification khi có friend request, channel invite
   - Endpoint: GET /notifications, PATCH /notifications/:id/read

---

## 7. Best Practices tóm tắt

| Hạng mục | Gợi ý |
|----------|--------|
| **Module** | 1 domain = 1 module, tách rõ |
| **Schema** | Friendship/Request rõ ràng, ChannelMember có role |
| **API** | RESTful, pagination, response format thống nhất |
| **Auth** | JwtAuthGuard + Resource Guard cho từng loại action |
| **Validation** | DTO + ValidationPipe cho mọi input |
| **Error** | Exception filters, message thống nhất |
| **Realtime** | WebSocket (Gateway) cho chat khi cần |

---

## 8. Tài liệu tham khảo

- [NestJS Modules](https://docs.nestjs.com/modules)
- [REST API Design](https://restfulapi.net/)
- [Prisma Relations](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations)
