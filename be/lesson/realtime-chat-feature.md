# Realtime Chat — Phân tích & Phạm vi

## Summary

Tính năng **realtime chat** cho phép hai thành viên trong một kênh DM nhận tin nhắn mới ngay lập tức mà không cần reload. Hướng tiếp cận: giữ **REST** cho gửi tin và lấy lịch sử (đã có), thêm **WebSocket (Socket.IO)** trên BE để broadcast tin mới tới mọi client đang mở kênh đó; FE kết nối WS với JWT, join room theo `channelId`, lắng nghe event `message` và append vào danh sách. Luồng đầy đủ: chọn kênh trên sidebar → mở trang chat theo `channelId` → load channel + messages (REST) → gửi tin (REST) → nhận tin mới qua WS và cập nhật UI.

---

## Scope

- **In scope:**
  - WebSocket gateway (Socket.IO) trên BE: xác thực JWT khi kết nối, join room theo `channelId`, broadcast tin mới tới room khi có message được tạo (từ REST).
  - FE: kết nối WS với access token, join room khi mở một kênh, hiển thị danh sách tin + ô nhập, gửi tin qua REST, nhận tin mới qua WS và thêm vào list.
  - Luồng: sidebar → chọn kênh (link /chat/[channelId]) → load channel info + messages → gửi/nhận realtime.

- **Out of scope:**
  - Typing indicator, read receipt, edit/delete message.
  - Reconnect/retry policy nâng cao (chỉ cơ bản).
  - Group channel; chỉ DM.

---

## Approach

1. **BE**
   - Cài `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`.
   - **ChatGateway:** namespace mặc định. Trong `handleConnection`: đọc JWT từ handshake (query hoặc auth header), verify bằng JwtService; nếu lỗi thì disconnect. Client gửi event `join` kèm `channelId` → server join socket vào room `channel:${channelId}`. MessageService sau khi `createMessage` gọi `ChatGateway.broadcastNewMessage(channelId, message)` để emit `message` tới room. Message gửi tin vẫn chỉ qua REST (POST /channel/:id/messages).
   - MessageModule import module chứa ChatGateway; MessageService inject ChatGateway và gọi broadcast sau khi tạo message.

2. **FE**
   - Cấu hình WS URL (cùng host/port với API, path `/socket.io` hoặc custom).
   - **Chat page:** route `/chat/[channelId]`. Load channel (getChannelById) và messages (getMessages). Hiển thị header (tên kênh), danh sách tin (scroll), input + nút gửi. Gửi tin: gọi `sendMessage(channelId, { content })`. Khi mount với channelId: connect Socket.IO với token, emit `join` với channelId; subscribe event `message` và append vào state. Unsubscribe/disconnect khi unmount hoặc đổi channelId.
   - **Sidebar:** ChannelCard hoặc channel list item dùng Link href `/chat/[channelId]` để mở chat. Dashboard (/) có thể redirect đến /chat hoặc hiển thị “Select a channel” với danh sách kênh.

3. **Đồng bộ**
   - Tin do chính user gửi: có thể thêm ngay vào UI (optimistic) hoặc chờ event từ WS. Đơn giản: gửi REST → BE tạo message và broadcast → tất cả client (kể cả sender) nhận event và append; sender có thể append local ngay rồi bỏ qua duplicate theo id khi nhận event.

---

## Alternatives considered

- **Chỉ polling:** Đơn giản nhưng trễ và tải server cao; không chọn.
- **Send message qua WS:** Có thể nhưng trùng logic với REST (validation, DB). Giữ gửi qua REST, WS chỉ để nhận realtime.
- **SSE thay Socket.IO:** Một chiều, đủ cho “nhận tin mới”; nhưng Socket.IO có sẵn adapter Nest, room, và handshake auth đơn giản nên chọn Socket.IO.

---

## Risks / dependencies

- **JWT trên WS:** Token gửi qua query hoặc handshake auth; cần cùng secret với REST. FE phải gửi access token khi connect.
- **CORS / origin:** Socket.IO server cần cho phép origin FE (giống REST).
- **Reconnect:** Mất kết nối thì client tự reconnect (Socket.IO mặc định); sau reconnect cần join lại room và có thể load thêm messages nếu cần.
