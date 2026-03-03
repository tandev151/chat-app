# Auth Module Review & Lessons Learned

## 1. Review Implementation Hiện Tại

### Điểm tốt ✓

- **Login flow rõ ràng**: Tìm user → so sánh password (bcrypt) → trả token
- **Thông báo lỗi an toàn**: Dùng "User not found" vs "Email or password is incorrect" – nên thống nhất thành 1 message để tránh enum user (xem mục 2.1)
- **Cấu trúc response**: `accessToken`, `refreshToken`, `expiresIn`, `type` – đủ cho client
- **JwtModule** đã config, dùng `JWT_SECRET_KEY` từ env
- **Validation**: LoginDto có IsNotEmpty

### Điểm cần cải thiện

| Vấn đề | Chi tiết |
|--------|----------|
| accessToken vs refreshToken | Cả hai dùng cùng `signOptions.expiresIn: '1h'` – refreshToken nên có thời hạn dài hơn |
| Không có JWT Guard | Mọi route (kể cả User) đều **public** – không kiểm tra token |
| Không có refresh endpoint | Client nhận refreshToken nhưng không có API để đổi lấy accessToken mới |
| NotFoundException | "User not found" lộ thông tin – nên dùng UnauthorizedException với message chung |

---

## 2. Bài Học 1: accessToken vs refreshToken – Có Nên Cùng Giá Trị?

### 2.1 Câu trả lời ngắn: **Không nên giống nhau**

accessToken và refreshToken cần **khác nhau** về:
- **Payload**
- **Thời hạn (expiresIn)**
- **Mục đích sử dụng**

### 2.2 Vì sao phải khác nhau?

| Tiêu chí | accessToken | refreshToken |
|----------|-------------|--------------|
| **Mục đích** | Xác thực mỗi request API | Chỉ dùng để **đổi** accessToken mới |
| **Thời hạn** | Ngắn (15m – 1h) | Dài (7 ngày – 30 ngày) |
| **Payload** | Có thể chứa roles, permissions | Chỉ cần `userId` (hoặc `sub`) |
| **Gửi đi đâu** | Gửi kèm mọi API request | Chỉ gửi tới endpoint refresh token |
| **Rủi ro khi lộ** | Thấp hơn (hết hạn nhanh) | Cao hơn (dùng được lâu) |

### 2.3 Implementation gợi ý (ý tưởng)

**accessToken:**
- Payload: `{ sub: userId, email }` (và roles nếu có)
- `expiresIn: '15m'` hoặc `'1h'`
- Dùng secret: `JWT_SECRET_KEY`

**refreshToken:**
- Payload: `{ sub: userId, type: 'refresh' }` (hoặc dùng `jti` – unique ID)
- `expiresIn: '7d'` hoặc `'30d'`
- Có thể dùng **secret khác** (`JWT_REFRESH_SECRET`) để tách biệt

**Trong code hiện tại của bạn:**
- Cả hai đều dùng `signOptions: { expiresIn: '1h' }` từ JwtModule
- Cần override `expiresIn` khi sign refreshToken:  
  `this.jwtService.sign(payload, { expiresIn: '7d' })`

### 2.4 Luồng Refresh Token

```
[Client]                         [API]
   |                                |
   |  accessToken sắp hết hạn       |
   |  POST /auth/refresh            |
   |  Body: { refreshToken }        |
   |------------------------------->|
   |                                |  Verify refreshToken
   |                                |  Tạo accessToken mới
   |<-------------------------------|
   |  { accessToken, expiresIn }    |
```

→ Cần thêm endpoint `POST /auth/refresh` nhận refreshToken, verify, rồi trả accessToken mới.

### 2.5 Kết luận Bài học 1

- **Không** tạo accessToken và refreshToken cùng payload, cùng thời hạn
- accessToken: ngắn hạn, dùng cho mọi request
- refreshToken: dài hạn, chỉ dùng để refresh
- Có thể dùng 2 secret khác nhau cho an toàn hơn

---

## 3. Bài Học 2: Middleware vs Guard – Nên Dùng Gì Cho Flow Này?

### 3.1 So sánh nhanh

| Khái niệm | Chạy khi nào | Dùng cho auth |
|-----------|--------------|---------------|
| **Middleware** | Mọi request (hoặc theo path) | Logging, CORS, parse body – **ít dùng cho verify JWT** |
| **Guard** | Trước khi vào controller/handler | **Verify JWT, check role** – phù hợp auth |
| **Interceptor** | Trước/sau handler | Transform response, logging |

→ **Cho auth: dùng Guard**, không cần middleware verify JWT.

### 3.2 Nên có Guard nào?

| Guard | Mục đích | Route cần bảo vệ |
|-------|----------|-------------------|
| **JwtAuthGuard** | Verify accessToken trong header `Authorization: Bearer <token>` | `/users/profile`, `/channels`, `/messages`, … |
| **Optional: ThrottleGuard** | Giới hạn số lần login/refresh (chống brute-force) | `POST /auth/login`, `POST /auth/refresh` |

### 3.3 Route nào public, route nào protected?

| Route | Public? | Lý do |
|-------|---------|-------|
| `POST /auth/login` | ✓ | Chưa có token |
| `POST /auth/refresh` | ✓ | Chỉ cần refreshToken trong body |
| `POST /api/users` (register) | ✓ | Tạo tài khoản mới |
| `GET /api/docs` (Swagger) | ✓ | Documentation |
| `GET /api/users/me` (profile) | ✗ | Cần biết user đang login |
| `GET/POST /channels`, `/messages` | ✗ | Cần xác thực |

### 3.4 Cách triển khai Guard

**Bước 1:** Cài `passport-jwt`, `@nestjs/passport`

**Bước 2:** Tạo `JwtStrategy` – extract token từ header, verify, gắn user vào `request.user`

**Bước 3:** Dùng `AuthGuard('jwt')` hoặc `JwtAuthGuard` (extends AuthGuard)

**Bước 4:** Gắn lên controller hoặc method:
- `@UseGuards(JwtAuthGuard)` trên controller → bảo vệ toàn bộ
- Hoặc trên từng method cần bảo vệ

**Bước 5 (tùy chọn):** Tạo `@Public()` decorator để đánh dấu route không cần auth. Nếu dùng global JwtAuthGuard thì các route có `@Public()` sẽ bị skip.

### 3.5 Middleware – Khi nào dùng?

Middleware **không** nên dùng để verify JWT vì:
- Guard đã đảm nhiệm việc đó
- NestJS Guard được thiết kế cho auth

Middleware nên dùng cho:
- Logging request/response
- Rate limiting toàn cục (có thể dùng Guard riêng cho login/refresh)
- Parse/gắn correlation ID
- CORS (đã dùng `enableCors`)

### 3.6 Kết luận Bài học 2

| Flow | Nên dùng |
|------|----------|
| Verify JWT khi gọi API | **JwtAuthGuard** + JwtStrategy |
| Login / Refresh | Giữ public, có thể thêm ThrottleGuard |
| Register | Public |
| Route cần auth | Gắn `@UseGuards(JwtAuthGuard)` |
| Logging, CORS | Middleware (nếu cần) |

---

## 4. Checklist Cải Thiện Auth Module

- [ ] Phân biệt accessToken vs refreshToken (payload + expiresIn)
- [ ] Thêm endpoint `POST /auth/refresh`
- [ ] Thống nhất message lỗi login: "Email hoặc mật khẩu không đúng"
- [ ] Tạo JwtStrategy + JwtAuthGuard
- [ ] Gắn Guard lên route cần bảo vệ (profile, channels, messages)
- [ ] (Tùy chọn) Tạo @Public() cho login, register, refresh, docs
- [ ] (Tùy chọn) ThrottleGuard cho login/refresh

---

## 5. Tóm tắt

1. **accessToken ≠ refreshToken**: Khác payload, khác thời hạn, khác mục đích.
2. **Guard cho auth**: Dùng JwtAuthGuard, không dùng middleware để verify JWT.
3. **Route public**: login, refresh, register, docs.
4. **Route protected**: profile, channels, messages, … – gắn Guard.
