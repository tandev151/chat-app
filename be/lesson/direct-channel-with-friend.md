# Kênh chat trực tiếp với bạn bè (Direct Channel)

## Tóm tắt

Tính năng cho phép hai người dùng **đã là bạn bè** (trạng thái ACCEPTED) tạo hoặc mở một kênh chat riêng 1-1 (direct channel), gửi và xem tin nhắn trong kênh đó. Giải pháp đề xuất: mở rộng model `Channel` hiện có với loại kênh **DM** (direct message), tái sử dụng `ChannelMember` và `Message`; cung cấp API get-or-create kênh DM với bạn, danh sách kênh DM, gửi tin nhắn và lấy tin nhắn có phân trang.

---

## Phạm vi

- **Thuộc phạm vi:**
  - Tạo/lấy kênh DM giữa hai user (chỉ khi đã là bạn bè).
  - Liệt kê các kênh DM của user đăng nhập.
  - Gửi tin nhắn vào kênh DM.
  - Lấy danh sách tin nhắn trong kênh DM (phân trang).
  - Ràng buộc: chỉ thành viên kênh mới gửi/xem tin.

- **Ngoài phạm vi (phiên bản này):**
  - Kênh nhóm (group channel), tạo kênh public/private.
  - Đọc chưa đọc (read receipt), typing indicator, realtime (WebSocket).
  - Xóa/sửa tin nhắn, thu hồi tin.

---

## Hướng tiếp cận

- Dùng chung bảng **Channel** và **Message** hiện có.
- Thêm trường phân biệt loại kênh (ví dụ `type: DM | GROUP` hoặc `isDirect: Boolean`) vào schema Prisma.
- Kênh DM: `type = DM`, đúng 2 `ChannelMember`, chỉ tạo khi hai user đã có quan hệ bạn bè ACCEPTED.
- Luồng: User chọn một bạn → gọi API lấy hoặc tạo kênh DM → gửi/xem tin qua API tin nhắn của kênh đó.

---

## Các API quan trọng cần có

### 1. Tạo hoặc lấy kênh DM với một bạn

- **Mục đích:** Mở cuộc trò chuyện 1-1 với bạn; nếu đã có kênh DM thì trả về, chưa thì tạo mới.
- **Đề xuất:**  
  `POST /channel/direct`  
  Body: `{ "friendId": "uuid" }`  
  Hoặc: `GET /channel/direct/:friendId` (idempotent, get-or-create).
- **Logic:**
  - Kiểm tra hai user đã là bạn (FriendShipRequest ACCEPTED).
  - Tìm Channel `type = DM` có đúng 2 member là `currentUser` và `friend`.
  - Nếu có → trả về channel đó; không thì tạo Channel (type DM) + 2 ChannelMember.
- **Response:** Thông tin channel (id, type, createdAt) và có thể kèm thông tin bạn (id, displayName).

---

### 2. Danh sách kênh DM của user

- **Mục đích:** Hiển thị danh sách cuộc trò chuyện 1-1 (sidebar, inbox).
- **Đề xuất:**  
  `GET /channel/direct`  
  Query: `limit`, `page` (hoặc cursor) để phân trang.
- **Logic:**
  - Lấy tất cả Channel mà user là member và `type = DM`.
  - Trả về kèm thông tin người còn lại (bạn) và có thể `lastMessage`, `lastMessageAt` (nếu cần).
- **Response:** Mảng channel, mỗi phần tử: channelId, friend (id, displayName), lastMessage (optional), lastMessageAt (optional).

---

### 3. Gửi tin nhắn vào kênh

- **Mục đích:** User gửi tin nhắn vào một kênh (DM hoặc sau này mở rộng group).
- **Đề xuất:**  
  `POST /channel/:channelId/messages`  
  Body: `{ "content": "nội dung tin nhắn" }`
- **Logic:**
  - Kiểm tra user đăng nhập là ChannelMember của `channelId`.
  - Nếu là kênh DM, có thể kiểm tra thêm channel.type === DM.
  - Tạo Message với channelId, userId, content.
- **Response:** Message vừa tạo (id, content, userId, channelId, createdAt).

---

### 4. Lấy tin nhắn trong kênh (phân trang)

- **Mục đích:** Hiển thị lịch sử chat khi mở một kênh DM.
- **Đề xuất:**  
  `GET /channel/:channelId/messages`  
  Query: `limit`, `page` (hoặc `cursor`, `limit`) — thống nhất với `PaginationQueryDto` hiện có.
- **Logic:**
  - Kiểm tra user là member của channel.
  - Query Message theo channelId, orderBy createdAt desc (mới nhất trước), phân trang.
- **Response:** Mảng Message (id, content, userId, createdAt) và có thể kèm thông tin user (displayName) để hiển thị.

---

### 5. (Tùy chọn) Lấy thông tin một kênh

- **Mục đích:** Chi tiết kênh (ví dụ khi mở màn hình chat).
- **Đề xuất:**  
  `GET /channel/:channelId`
- **Logic:** Kiểm tra user là member, trả về thông tin channel + members (với DM là 2 user).
- **Response:** Channel (id, type, createdAt) + danh sách members (id, displayName).

---

## Các lựa chọn đã cân nhắc

- **Tách bảng DirectChannel riêng:** Trùng dữ liệu với Channel/Message, tăng độ phức tạp. Không chọn.
- **Chỉ dùng GET cho get-or-create DM:** GET không nên tạo resource theo chuẩn REST; dùng POST hoặc GET + query rõ ràng (get-or-create) đều được, cần thống nhất một cách trong project.

---

## Rủi ro / phụ thuộc

- **Schema:** Cần migration Prisma thêm `type` (enum DM | GROUP) hoặc `isDirect` cho `Channel`; đảm bảo ràng buộc “kênh DM chỉ có đúng 2 member” bằng logic ứng dụng (hoặc constraint nếu cần).
- **Quan hệ bạn bè:** API DM phụ thuộc vào FriendShipRequest ACCEPTED; cần dùng lại logic từ FriendService (hoặc shared helper) để tránh trùng code.
- **Phân trang tin nhắn:** Nên dùng cursor (theo `createdAt` hoặc `id`) cho chat để ổn định khi có tin nhắn mới; nếu dùng page/limit thì giữ nhất quán với `PaginationQueryDto` hiện có.

---

## Checklist triển khai nhanh

- [ ] Cập nhật Prisma: thêm `type` (hoặc `isDirect`) cho `Channel`.
- [ ] Migration và cập nhật generated client.
- [ ] ChannelService: `getOrCreateDirectChannel(userId, friendId)`, `getDirectChannels(userId, pagination)`.
- [ ] MessageService: `createMessage(channelId, userId, content)`, `getMessages(channelId, userId, pagination)`.
- [ ] ChannelController: POST (hoặc GET) direct, GET direct list, GET /:channelId; kiểm tra member + JWT.
- [ ] MessageController: POST /channel/:channelId/messages, GET /channel/:channelId/messages; kiểm tra member.
- [ ] Đăng ký ChannelModule, MessageModule (controller, service, import PrismaModule/FriendModule nếu cần kiểm tra bạn bè).
