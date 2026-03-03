# Cấu hình triển khai tại http://136.116.129.100

Báo cáo các thay đổi cần thiết trên server khi deploy ứng dụng Chat tại **http://136.116.129.100**.

---

## 1. Tổng quan kiến trúc

| Thành phần      | Port (mặc định) | URL khi deploy              |
|-----------------|------------------|-----------------------------|
| Frontend (Next) | 3001             | http://136.116.129.100 (hoặc :3001) |
| Backend API     | 3000             | http://136.116.129.100:3000/api      |
| WebSocket (WS)  | 3002             | http://136.116.129.100:3002          |

Trình duyệt gọi API và kết nối Socket.IO từ trang chạy tại `136.116.129.100`, nên backend phải cho phép origin này trong CORS.

---

## 2. Thay đổi trong source trên server

### 2.1. Backend — CORS (đã cấu hình sẵn)

Trong source đã thêm `http://136.116.129.100` vào CORS tại:

- **`chat/be/src/main.ts`** — `app.enableCors({ origin: [...] })`
- **`chat/be/src/chat/chat.gateway.ts`** — `@WebSocketGateway({ cors: { origin: [...] } })`

Chỉ cần deploy bản code đã có thay đổi này. Nếu sau này dùng domain khác hoặc HTTPS, cần bổ sung origin tương ứng (ví dụ `https://136.116.129.100`).

### 2.2. Frontend — biến môi trường (bắt buộc)

**Trên server, khi build/chạy Frontend**, cần set biến môi trường:

- **`NEXT_PUBLIC_API_URL`**  
  URL đầy đủ tới API.  
  Ví dụ: `http://136.116.129.100:3000/api`  
  (Nếu dùng proxy: `http://136.116.129.100/api`.)

- **`NEXT_PUBLIC_WS_URL`**  
  URL đầy đủ tới server Socket.IO (đúng port WS).  
  Ví dụ: `http://136.116.129.100:3002`  
  (Nếu proxy chuyển WS qua subpath hoặc port khác thì điều chỉnh cho đúng.)

Ví dụ file `.env` hoặc `.env.production` trong thư mục `chat/fe/`:

```env
NEXT_PUBLIC_API_URL=http://136.116.129.100:3000/api
NEXT_PUBLIC_WS_URL=http://136.116.129.100:3002
```

Sau khi sửa env, cần **build lại** frontend (`pnpm build` hoặc `npm run build`) rồi mới chạy/chạy lại container (vì `NEXT_PUBLIC_*` được nhúng lúc build).

---

## 3. Backend — biến môi trường trên server

Trong thư mục `chat/be/` (hoặc trong Docker/env của backend), đảm bảo có:

| Biến             | Ý nghĩa              | Ví dụ |
|------------------|----------------------|--------|
| `PORT`           | Port HTTP API        | `3000` |
| `WS_PORT`        | Port server Socket.IO | `3002` |
| `DATABASE_URL`   | Chuỗi kết nối PostgreSQL | `postgresql://user:pass@host:5432/chat_app` |
| `JWT_SECRET_KEY` | Secret ký JWT        | (giá trị bí mật, giữ an toàn) |

---

## 4. Mở port trên server / firewall

Đảm bảo từ internet (hoặc từ reverse proxy) có thể truy cập:

- **3000** — Backend API (hoặc map qua proxy).
- **3002** — WebSocket (Socket.IO).  
  Nếu dùng proxy, cần cấu hình proxy chuyển tiếp cả HTTP và WS tới port 3002.

---

## 5. Nếu dùng reverse proxy (Nginx / Caddy)

Khi truy cập qua **http://136.116.129.100** (port 80) và proxy tới backend:

- **API:** ví dụ `/api` → `http://127.0.0.1:3000/api`.
- **WebSocket:** cần một location (hoặc subdomain) proxy tới `http://127.0.0.1:3002` và hỗ trợ upgrade WebSocket.

Khi đó:

- `NEXT_PUBLIC_API_URL` = `http://136.116.129.100/api` (không cần ghi port).
- `NEXT_PUBLIC_WS_URL` = `http://136.116.129.100` (nếu proxy WS tại `/socket.io` trên cùng host) hoặc URL đầy đủ tới endpoint WS mà proxy đã cấu hình.

CORS vẫn phải cho phép origin `http://136.116.129.100` (và `https://...` nếu dùng HTTPS).

---

## 6. Checklist triển khai

- [x] Backend: CORS đã có `http://136.116.129.100` trong `main.ts` và `chat.gateway.ts`.
- [ ] Backend: set `PORT`, `WS_PORT`, `DATABASE_URL`, `JWT_SECRET_KEY` trên server (hoặc trong Docker).
- [ ] Frontend: set `NEXT_PUBLIC_API_URL` và `NEXT_PUBLIC_WS_URL` đúng với cách truy cập thực tế (có/không proxy).
- [ ] Frontend: build lại sau khi đổi env.
- [ ] Server/firewall: mở port 3000 và 3002 (hoặc cấu hình proxy tương ứng).
- [ ] Kiểm tra: mở http://136.116.129.100, đăng nhập và gửi tin nhắn; kiểm tra tab Network (WS) và Console không lỗi CORS/WebSocket.

---

*Tài liệu đi kèm: `WEBSOCKET-BEHAVIOR.md` (mô tả luồng WebSocket và cấu hình WS).*
