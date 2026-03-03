# Checklist & Hướng dẫn từng bước — Direct Channel

Tài liệu này sắp xếp công việc theo **độ ưu tiên** và hướng dẫn xử lý **từng bước** dựa trên [direct-channel-with-friend.md](./direct-channel-with-friend.md).

---

## Checklist theo độ ưu tiên

### P1 — Nền tảng (Schema & DB)

| # | Việc cần làm | Trạng thái |
|---|----------------|------------|
| 1.1 | Cập nhật Prisma schema: thêm `type` enum (DM \| GROUP) cho model `Channel` | ☐ |
| 1.2 | Cho phép `name` (và `description`) nullable với kênh DM, hoặc set default (ví dụ `"DM"`) | ☐ |
| 1.3 | Chạy migration: `pnpm prisma migrate dev --name add-channel-type` | ☐ |
| 1.4 | Kiểm tra generated client: `generated/prisma` đã có field `type` trên Channel | ☐ |

---

### P2 — Dịch vụ (Services & logic)

| # | Việc cần làm | Trạng thái |
|---|----------------|------------|
| 2.1 | **ChannelService:** Kiểm tra hai user đã là bạn (ACCEPTED) — dùng Prisma hoặc gọi FriendService | ☑ |
| 2.2 | **ChannelService:** `getOrCreateDirectChannel(userId, friendId)` — tìm hoặc tạo Channel DM + 2 ChannelMember | ☑ |
| 2.3 | **ChannelService:** `getDirectChannels(userId, pagination)` — danh sách channel DM của user, kèm thông tin bạn (lastMessage optional) | ☑ |
| 2.4 | **ChannelService:** `getChannelById(channelId, userId)` — lấy chi tiết kênh, kiểm tra user là member | ☑ |
| 2.5 | **MessageService:** `createMessage(channelId, userId, content)` — kiểm tra member rồi tạo Message | ☑ |
| 2.6 | **MessageService:** `getMessages(channelId, userId, pagination)` — kiểm tra member, query Message phân trang (mới nhất trước) | ☑ |

---

### P3 — API (Controller, DTO, Guard)

| # | Việc cần làm | Trạng thái |
|---|----------------|------------|
| 3.1 | DTO: `CreateDirectChannelDto` — `friendId` (UUID, required) | ☑ |
| 3.2 | DTO: `SendMessageDto` — `content` (string, required, max length) | ☑ |
| 3.3 | **ChannelController:** `POST /channel/direct` (body: friendId), JWT, gọi getOrCreateDirectChannel | ☑ |
| 3.4 | **ChannelController:** `GET /channel/direct` (query: limit, page), JWT, gọi getDirectChannels | ☑ |
| 3.5 | **ChannelController:** `GET /channel/:channelId` (JWT), kiểm tra member, gọi getChannelById | ☑ |
| 3.6 | **MessageController:** `POST /channel/:channelId/messages` (body: content), JWT, kiểm tra member, gọi createMessage | ☑ |
| 3.7 | **MessageController:** `GET /channel/:channelId/messages` (query: limit, page), JWT, kiểm tra member, gọi getMessages | ☑ |

---

### P4 — Ghép nối (Module & test nhanh)

| # | Việc cần làm | Trạng thái |
|---|----------------|------------|
| 4.1 | **ChannelModule:** import PrismaModule, FriendModule (nếu dùng FriendService); đăng ký ChannelController, ChannelService | ☐ |
| 4.2 | **MessageModule:** import PrismaModule; đăng ký MessageController, MessageService | ☐ |
| 4.3 | Đảm bảo AppModule đã import ChannelModule, MessageModule | ☐ |
| 4.4 | Chạy app, gọi API thử (Postman/curl): POST direct, GET direct list, POST message, GET messages | ☐ |

---

## Hướng dẫn xử lý từng bước

Làm lần lượt theo P1 → P2 → P3 → P4. Mỗi bước xong thì tick ☐ → ☑ trong bảng trên.

---

### Bước 1 — P1: Schema & migration

**Mục tiêu:** Có trường `type` trên Channel và dữ liệu DB đã đồng bộ.

1. Mở `prisma/schema.prisma`.
2. Thêm enum (trước hoặc sau model Channel):
   ```prisma
   enum ChannelType {
     DM
     GROUP
   }
   ```
3. Trong model `Channel`:
   - Thêm `type ChannelType @default(GROUP)`.
   - Nếu muốn DM không bắt buộc name: đổi `name String` thành `name String?` (optional).
4. Lưu file, chạy:
   ```bash
   cd chat/be && pnpm prisma migrate dev --name add-channel-type
   ```
5. Kiểm tra thư mục `generated/prisma`: client đã có `ChannelType` và `Channel.type`.

**Xong P1:** Tick 1.1 → 1.4.

---

### Bước 2 — P2.1 & P2.2: ChannelService — bạn bè & get-or-create DM

**Mục tiêu:** Có hàm kiểm tra hai user là bạn và hàm get-or-create kênh DM.

1. Tạo `src/channel/channel.service.ts`.
2. **Kiểm tra bạn bè:** Viết private method hoặc dùng Prisma:
   - Query `FriendShipRequest` có (requestUserId = A, addresseeId = B) hoặc ngược lại, và `status = 'ACCEPTED'`.
   - Nếu cần dùng FriendService, inject `FriendModule` vào ChannelModule và gọi `getFriends(userId)` rồi kiểm tra friendId có trong danh sách.
3. **getOrCreateDirectChannel(userId, friendId):**
   - Gọi kiểm tra bạn bè; nếu không phải bạn → throw Forbidden/ BadRequest.
   - Tìm Channel: `type = DM`, và có đúng 2 ChannelMember là `userId` và `friendId` (dùng `findFirst` + filter members).
   - Nếu tìm thấy → return channel (có thể include members).
   - Nếu chưa có: `prisma.channel.create` với `type: 'DM'`, `name: 'DM'` (hoặc null nếu đã optional), `createdById: userId`; sau đó tạo 2 `ChannelMember` cho userId và friendId.
4. Export ChannelService trong ChannelModule (providers).

**Xong:** Tick 2.1, 2.2.

---

### Bước 3 — P2.3 & P2.4: ChannelService — danh sách DM & chi tiết kênh

**Mục tiêu:** Lấy danh sách kênh DM của user và chi tiết một kênh (kèm members).

1. **getDirectChannels(userId, pagination):**
   - `channel.findMany` where: user là member (qua `channelMembers`), và `type = 'DM'`.
   - Order by (ví dụ) `updatedAt` hoặc qua last message (nếu đã có relation).
   - Include: `channelMembers` với `user` (id, displayName) để biết “bạn” là ai; có thể include `messages` orderBy createdAt desc take 1 để lấy lastMessage (optional).
   - Phân trang: skip/take từ pagination (page/limit).
2. **getChannelById(channelId, userId):**
   - Tìm channel theo id; kiểm tra user có trong `channelMembers` không.
   - Nếu không → throw Forbidden.
   - Return channel + members (id, displayName).

**Xong:** Tick 2.3, 2.4.

---

### Bước 4 — P2.5 & P2.6: MessageService

**Mục tiêu:** Tạo tin nhắn và lấy danh sách tin nhắn (có kiểm tra member).

1. Tạo `src/message/message.service.ts`.
2. **createMessage(channelId, userId, content):**
   - Kiểm tra user là ChannelMember của channel (query ChannelMember hoặc channel.channelMembers).
   - Nếu không → throw Forbidden.
   - `prisma.message.create({ data: { channelId, userId, content } })`.
   - Return message (có thể include user.displayName).
3. **getMessages(channelId, userId, pagination):**
   - Kiểm tra member tương tự.
   - `message.findMany` where channelId, orderBy createdAt desc, skip/take (hoặc cursor).
   - Return mảng message (include user id, displayName nếu cần).

**Xong:** Tick 2.5, 2.6.

---

### Bước 5 — P3: DTO & Controller

**Mục tiêu:** Có route và DTO cho từng API.

1. **DTOs:**
   - `src/channel/dto/create-direct-channel.dto.ts`: `friendId` (IsUUID, IsNotEmpty).
   - `src/message/dto/send-message.dto.ts`: `content` (IsString, MinLength, MaxLength).
2. **ChannelController:**
   - `POST /channel/direct` — Body(CreateDirectChannelDto), CurrentUser, UseGuards(JwtAuthGuard) → getOrCreateDirectChannel.
   - `GET /channel/direct` — Query(PaginationQueryDto), CurrentUser → getDirectChannels.
   - `GET /channel/:channelId` — Param channelId, CurrentUser → getChannelById.
3. **MessageController:**
   - Routes có thể đặt dưới Channel (nest resource): `POST /channel/:channelId/messages`, `GET /channel/:channelId/messages`.
   - Hoặc tách MessageController và dùng param `channelId` rồi gọi MessageService.
   - Cả hai route: JWT, lấy userId từ CurrentUser, gọi createMessage / getMessages; kiểm tra member nằm trong service đã làm.

**Xong:** Tick 3.1 → 3.7.

---

### Bước 6 — P4: Module & test

**Mục tiêu:** App chạy được và gọi được đủ API.

1. **ChannelModule:** imports: PrismaModule (và FriendModule nếu dùng); controllers: [ChannelController]; providers: [ChannelService].
2. **MessageModule:** imports: PrismaModule; controllers: [MessageController]; providers: [MessageService].
3. AppModule đã import ChannelModule, MessageModule — kiểm tra lại.
4. Chạy `pnpm run start:dev`, dùng Postman/curl:
   - Login lấy JWT.
   - POST /channel/direct với body `{ "friendId": "<id bạn đã accept>" }`.
   - GET /channel/direct.
   - POST /channel/:channelId/messages với body `{ "content": "Hello" }`.
   - GET /channel/:channelId/messages?limit=20&page=1.

**Xong:** Tick 4.1 → 4.4.

---

## Thứ tự tóm tắt

1. **P1** — Schema + migration.  
2. **P2** — ChannelService (bạn bè, get-or-create, list DM, get by id) + MessageService (create, list).  
3. **P3** — DTO + ChannelController + MessageController.  
4. **P4** — Module wiring + test API.

Nếu một bước gặp lỗi (ví dụ Prisma relation, guard), xử lý xong bước đó rồi mới chuyển sang bước tiếp theo. Có thể đánh dấu trạng thái trực tiếp trong file này (☐ → ☑) để theo dõi tiến độ.
