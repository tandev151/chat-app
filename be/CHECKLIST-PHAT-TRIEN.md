# Checklist phát triển liên tục – Chat Backend (tiếng Việt)

**Lưu ý:** Tài liệu này chỉ là checklist từng bước và thiết kế hướng đi, **không implement code**. Dùng để triển khai dần các tính năng mạnh (power features) theo đúng thứ tự và chuẩn đã định.

---

## Giai đoạn 0: Chuẩn bị nền tảng (bắt buộc trước khi làm Friendship/Channel/Message)

- [ ] **0.1** Sửa/sửa xong `prisma/schema.prisma`: xóa hoặc hoàn thiện dòng `model ` thừa ở cuối file.
- [ ] **0.2** Thêm **JwtStrategy** (PassportStrategy) dùng cùng secret với JwtModule, verify accessToken và trả user (ít nhất `userId`, `email`) gắn vào `request.user`.
- [ ] **0.3** Tạo **JwtAuthGuard** (AuthGuard('jwt')) và áp dụng cho các route cần đăng nhập.
- [ ] **0.4** Tạo decorator **@CurrentUser()** để lấy `request.user` (ví dụ `{ userId: string }`) trong controller.
- [ ] **0.5** (Tùy chọn) Thêm endpoint **POST /api/auth/register** và chuyển logic tạo user từ POST /users sang đây; giữ POST /users cho CRUD admin hoặc bỏ nếu không dùng.

---

## Giai đoạn 1: Friendship (theo lesson 05, 06)

- [ ] **1.1** Trong FriendShipModule: thêm FriendShipService, FriendShipController; inject PrismaService, JwtAuthGuard (hoặc guard tương đương).
- [ ] **1.2** DTO & validation: SendRequestDto (`addresseeId`: UUID, bắt buộc); định nghĩa response interface (id, requestUserId, addresseeId, status, createdAt, respondedAt; có thể thêm requester/addressee).
- [ ] **1.3** **POST /api/friends/requests** (hoặc /friends/request):  
  Guard: JWT. Logic: không gửi cho chính mình; addressee tồn tại; chưa có PENDING; chưa ACCEPTED; tạo FriendShipRequest status PENDING. Trả 201 + object request. Xử lý 400/404 đúng edge case.
- [ ] **1.4** **POST /api/friends/requests/:id/accept**:  
  Guard: JWT. Chỉ addressee được accept; request tồn tại; status = PENDING. Cập nhật ACCEPTED, respondedAt. Trả 200 + request. Xử lý 400/403/404.
- [ ] **1.5** **POST hoặc PATCH /api/friends/requests/:id/reject**: Chỉ addressee; status PENDING → REJECTED, respondedAt.
- [ ] **1.6** **DELETE hoặc POST /api/friends/requests/:id/cancel**: Chỉ requester; hủy lời mời (CANCELLED hoặc xóa tùy thiết kế).
- [ ] **1.7** **GET /api/friends/requests/sent** và **GET /api/friends/requests/received**: Chỉ user đăng nhập; trả danh sách request tương ứng (có thể pagination).
- [ ] **1.8** **GET /api/friends**: Danh sách bạn (các FriendShipRequest status ACCEPTED mà userId là requestUserId hoặc addresseeId). Có thể pagination (offset hoặc cursor).
- [ ] **1.9** (Tùy chọn) Bảng **Friendship** riêng: khi accept tạo 2 bản ghi (A↔B) hoặc 1 bản ghi bidirectional; GET /friends lấy từ bảng này.

---

## Giai đoạn 2: Channel (theo lesson 05)

- [ ] **2.1** Schema (nếu chưa): Thêm **Channel.type** (PUBLIC | PRIVATE); **ChannelMember.role** (ADMIN | MEMBER). Migration tương ứng.
- [ ] **2.2** ChannelService: create (name, description?, type?); getById; update; delete (chỉ creator hoặc admin). Tạo ChannelMember cho creator với role ADMIN.
- [ ] **2.3** **POST /api/channels**: Tạo channel (Guard JWT). Trả 201 + channel.
- [ ] **2.4** **GET /api/channels**: List channels (có thể filter: của tôi / public / đã join). Pagination.
- [ ] **2.5** **GET /api/channels/:id**: Chi tiết channel (kiểm tra quyền xem: member hoặc public).
- [ ] **2.6** **PATCH /api/channels/:id**: Cập nhật (chỉ creator/admin). Body: name, description, type.
- [ ] **2.7** **DELETE /api/channels/:id**: Xóa (chỉ creator/admin).
- [ ] **2.8** **POST /api/channels/:id/members** (invite): Body `userIds[]`. Chỉ ADMIN/owner. Tạo ChannelMember (role MEMBER). Private channel: bắt buộc invite; Public: có thể tự join (nếu có endpoint join).
- [ ] **2.9** **GET /api/channels/:id/members**: Danh sách member (chỉ member channel mới xem được).
- [ ] **2.10** **PATCH /api/channels/:id/members/:userId**: Đổi role (chỉ ADMIN).
- [ ] **2.11** **DELETE /api/channels/:id/members/:userId**: Xóa member (chỉ ADMIN hoặc tự rời). Không xóa owner/creator (hoặc quy định chuyển quyền).

---

## Giai đoạn 3: Message

- [ ] **3.1** MessageService: create (channelId, userId, content); getByChannelId với pagination (offset hoặc cursor).
- [ ] **3.2** Guard/kiểm tra: Chỉ **member của channel** mới gửi và xem message.
- [ ] **3.3** **POST /api/channels/:id/messages**: Body `content`. Trả 201 + message.
- [ ] **3.4** **GET /api/channels/:id/messages**: Query `?page=1&limit=20` hoặc `?cursor=xxx&limit=20`. Trả danh sách message (có thể sort mới nhất cuối hoặc đầu tùy frontend).
- [ ] **3.5** (Tùy chọn) **PATCH/DELETE** message (chỉ tác giả hoặc admin channel) – nếu product cần chỉnh/xóa tin.

---

## Giai đoạn 4: Realtime & trải nghiệm nâng cao

- [ ] **4.1** Cài **@nestjs/websockets**, **@nestjs/platform-socket.io** (hoặc adapter khác). Tạo **MessageGateway** (hoặc ChatGateway).
- [ ] **4.2** Gateway: xác thực JWT (handshake auth); room = channelId; join room khi client subscribe channel; broadcast message mới tới room khi có POST message thành công.
- [ ] **4.3** Client: kết nối WebSocket với token; join room theo channel; nhận event message mới; (tùy chọn) typing indicator, read receipt.

---

## Giai đoạn 5: Chuẩn hóa API & chất lượng

- [ ] **5.1** Response format thống nhất: ví dụ `{ data, meta?: { total, page, limit }, message? }` cho list; `data` trực tiếp cho single resource (theo lesson 05).
- [ ] **5.2** Pagination thống nhất: quy định offset (`page`, `limit`) hoặc cursor (`cursor`, `limit`) cho từng loại API; document trong Swagger.
- [ ] **5.3** Exception filter: trả lỗi thống nhất (code, message, statusCode) cho 400/401/403/404/500.
- [ ] **5.4** Swagger: mô tả đầy đủ DTO, response, auth Bearer cho từng endpoint protected.

---

## Giai đoạn 6 (Tùy chọn): Notification

- [ ] **6.1** Schema: bảng Notification (userId, type: FRIEND_REQUEST | CHANNEL_INVITE | …, refId, readAt, createdAt).
- [ ] **6.2** Tạo notification khi: gửi friend request; invite vào channel (và có thể khi accept friend).
- [ ] **6.3** **GET /api/notifications**: Danh sách (pagination); **PATCH /api/notifications/:id/read**: đánh dấu đã đọc.
- [ ] **6.4** (Tùy chọn) Push qua WebSocket khi có notification mới (user room).

---

## Thứ tự ưu tiên gợi ý

1. **Giai đoạn 0** (bắt buộc) → **Giai đoạn 1** (Friendship) → **Giai đoạn 2** (Channel) → **Giai đoạn 3** (Message).  
2. Sau khi CRUD + Message ổn: **Giai đoạn 4** (WebSocket).  
3. Song song hoặc sau: **Giai đoạn 5** (chuẩn hóa).  
4. **Giai đoạn 6** khi cần trải nghiệm thông báo.

Mỗi bước trong checklist có thể tách thành task nhỏ (ví dụ 1.3 = task “Send friend request API”) và implement từng task một; không bắt buộc implement toàn bộ trong một lần.
