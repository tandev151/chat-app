# Hướng dẫn từng bước: Xây dựng Auth Module

## Mục đích

Tài liệu này là **hướng dẫn và bài học** để bạn tự xây dựng Auth module. Không implement code thay bạn – chỉ giải thích **làm gì**, **làm theo thứ tự nào**, và **học được gì** từ mỗi bước.

---

## 1. Tổng quan luồng xác thực (Auth Flow)

### 1.1 Phân biệt Register và Login

| Hành động | Mục đích | Input | Output |
|-----------|----------|-------|--------|
| **Register** | Tạo tài khoản mới | email, password, displayName | User object (đã có trong UserModule) |
| **Login** | Xác minh người dùng đã tồn tại | email, password | **Access Token** (JWT) |

→ **Auth module** chủ yếu xử lý **Login** và **bảo vệ route** bằng token. Register có thể để trong UserModule hoặc gọi từ Auth nếu cần.

### 1.2 Luồng Login (JWT-based)

```
[Client]                    [Auth API]                    [Database]
   |                              |                              |
   |  POST /auth/login            |                              |
   |  { email, password }         |                              |
   |----------------------------->|                              |
   |                              |  1. Tìm user theo email      |
   |                              |----------------------------->|
   |                              |<-----------------------------|
   |                              |  2. So sánh password (bcrypt.compare) |
   |                              |  3. Tạo JWT token            |
   |<-----------------------------|                              |
   |  { access_token: "..." }     |                              |
   |                              |                              |
   |  GET /api/protected-route    |                              |
   |  Authorization: Bearer <token>                              |
   |----------------------------->|  4. Verify token              |
   |<-----------------------------|  5. Trả về data               |
```

**Điểm quan trọng:**
- Login trả về **token**, không trả về user object trực tiếp (có thể kèm user nếu cần).
- Mọi request sau đó gửi token trong header `Authorization: Bearer <token>`.
- Server **verify token** trước khi cho phép truy cập route được bảo vệ.

---

## 2. Các khái niệm cần nắm

### 2.1 JWT (JSON Web Token)

**JWT là gì?**
- Chuỗi mã hóa chứa thông tin (claims) như `userId`, `email`, `exp` (thời gian hết hạn).
- Gồm 3 phần: `header.payload.signature`, ngăn cách bởi dấu chấm.
- **Stateless**: Server không cần lưu session, chỉ cần verify chữ ký.

**Tại sao dùng JWT?**
- Không cần lưu session trên server (phù hợp API stateless, scale ngang).
- Client (web/mobile) chỉ cần lưu token và gửi kèm mỗi request.

### 2.2 Passport (NestJS)

**Passport là gì?**
- Thư viện xử lý authentication trong Node.js.
- NestJS có `@nestjs/passport` – tích hợp Passport với Nest.
- Dùng **Strategy** (chiến lược) – ví dụ: `JwtStrategy`, `LocalStrategy`.

**LocalStrategy**: Dùng khi login (email + password).
**JwtStrategy**: Dùng khi verify token trong mỗi request.

### 2.3 Guards

**Guard là gì?**
- Lớp kiểm tra điều kiện trước khi vào controller/handler.
- `AuthGuard('jwt')` → gọi JwtStrategy, verify token.
- Nếu token hợp lệ → request đi tiếp. Nếu không → trả 401 Unauthorized.

**Cách dùng:**
- Gắn lên controller: bảo vệ toàn bộ controller.
- Gắn lên method: chỉ bảo vệ method đó.
- Có thể tạo `@Public()` decorator để đánh dấu route không cần auth (ví dụ: login, register).

---

## 3. Thứ tự triển khai (Implementation Order)

Làm theo đúng thứ tự để tránh phụ thuộc ngược và dễ debug.

### Bước 1: Cài đặt dependencies

**Cần cài:**
- `@nestjs/passport` – tích hợp Passport với NestJS
- `@nestjs/jwt` – tạo và verify JWT
- `passport` – core Passport
- `passport-jwt` – strategy JWT
- `passport-local` – strategy Local (email + password)

**Bài học:**
- Mỗi package có vai trò riêng. Đọc README/docs ngắn gọn để hiểu cách dùng.
- `@nestjs/jwt` dùng để sign token, `passport-jwt` dùng để verify token khi có request.

---

### Bước 2: Định nghĩa cấu trúc dữ liệu (DTOs & Interfaces)

**Login DTO (Input):**
- Bạn đã có `CreatAuthDto` (nên đổi tên thành `LoginDto` cho rõ nghĩa).
- Cần: `email`, `password`.
- Dùng `class-validator` tương tự `CreateUserDto` (IsEmail, IsNotEmpty, MinLength...).

**Auth Response (Output):**
- Định nghĩa trong `auth.interface.ts`: `{ access_token: string }` (có thể thêm `user`, `expiresIn`).
- Giúp type-safe và dễ document Swagger.

**Bài học:**
- DTO = input validation. Interface = output shape.
- Đặt tên rõ ràng: `LoginDto` thay vì `CreateAuthDto` tránh nhầm với "tạo auth".

---

### Bước 3: Cấu hình JWT Module

**Trong `AuthModule`:**
- Import `JwtModule.register()` với options: `secret`, `signOptions: { expiresIn }`.
- Secret nên lấy từ `process.env.JWT_SECRET` (không hardcode).
- `expiresIn`: ví dụ `'7d'`, `'1h'` – thời gian token có hiệu lực.

**Bài học:**
- JWT secret phải đủ mạnh và bí mật. Dùng biến môi trường.
- `expiresIn` càng ngắn càng an toàn, nhưng UX có thể kém (phải login lại nhiều).

---

### Bước 4: Viết AuthService – Logic Login

**Chức năng:**
1. Nhận `LoginDto` (email, password).
2. Tìm user theo email qua Prisma (`prisma.user.findUnique`).
3. Nếu không tìm thấy → throw `UnauthorizedException` (hoặc tương đương).
4. Dùng `bcrypt.compare(plainPassword, user.passwordHash)` để so sánh mật khẩu.
5. Nếu không khớp → throw `UnauthorizedException`.
6. Nếu khớp → dùng `JwtService.sign()` tạo token với payload (ví dụ: `{ sub: user.id, email: user.email }`).
7. Return `{ access_token: token }` (hoặc kèm thêm user nếu cần).

**Cần inject:**
- `PrismaService` – truy vấn user
- `JwtService` – tạo token

**Bài học:**
- **Không bao giờ** trả về thông báo "email không tồn tại" hay "mật khẩu sai" riêng biệt – dùng chung "Email hoặc mật khẩu không đúng" để tránh enum user.
- `bcrypt.compare` là async – nhớ `await`.
- Payload JWT thường có `sub` (subject) = userId, dùng sau này trong Guard/Strategy.

---

### Bước 5: Viết LocalStrategy (Passport)

**Mục đích:**
- Validate email + password khi gọi `AuthGuard('local')`.
- Strategy gọi `AuthService.validateUser(email, password)`.
- Nếu hợp lệ → trả user, Passport gắn vào `request.user`.
- Nếu không → throw, Passport trả 401.

**Tại sao cần:**
- Có thể dùng Guard cho route login: `@UseGuards(AuthGuard('local'))` – nhưng thường login route không cần guard, chỉ cần gọi `AuthService.login()` trực tiếp.
- LocalStrategy hữu ích nếu sau này có flow "session-based" hoặc muốn tái sử dụng logic validate.

**Bài học:**
- Với flow JWT đơn giản, có thể bỏ qua LocalStrategy và chỉ dùng `AuthService.login()` trong controller. LocalStrategy dùng khi muốn chuẩn hóa theo Passport.

---

### Bước 6: Viết JwtStrategy (Passport)

**Mục đích:**
- Verify JWT từ header `Authorization: Bearer <token>`.
- Extract payload (userId, email...).
- Trả về object user (hoặc payload) gắn vào `request.user`.
- Dùng cho `AuthGuard('jwt')`.

**Cần:**
- Cùng `secret` với JwtModule.
- `jwtFromRequest`: extract token từ header (dùng `ExtractJwt.fromAuthHeaderAsBearerToken()`).
- Trong `validate(payload)`: có thể load user từ DB theo `payload.sub` nếu cần thông tin mới nhất.

**Bài học:**
- Strategy chạy **mỗi request** có `AuthGuard('jwt')`. Logic trong `validate` nên gọn, tránh query nặng nếu không cần.
- Payload đã được verify chữ ký bởi Passport – chỉ cần validate business logic (user còn tồn tại, chưa bị khóa...).

---

### Bước 7: Viết AuthController

**Endpoints:**
- `POST /auth/login` – nhận `LoginDto`, gọi `AuthService.login()`, trả `{ access_token }`.
- (Tuỳ chọn) `GET /auth/profile` – route được bảo vệ bởi `AuthGuard('jwt')`, trả `request.user` để test.

**Bài học:**
- Login route **không** dùng `AuthGuard('jwt')` – vì chưa có token.
- Route profile **có** dùng `AuthGuard('jwt')` – để kiểm tra token hoạt động.

---

### Bước 8: Đăng ký AuthModule và cấu hình

**AuthModule cần:**
- Import: `PrismaModule` (hoặc dùng global), `JwtModule`, `PassportModule`.
- Providers: `AuthService`, `LocalStrategy`, `JwtStrategy`.
- Controllers: `AuthController`.
- Exports: `AuthService`, `JwtModule` (nếu module khác cần verify token).

**AppModule:**
- Đã import `AuthModule` – kiểm tra lại.

**Global prefix:**
- Nếu dùng `api` → route login là `POST /api/auth/login` (nếu controller có prefix `auth`).

---

### Bước 9: Bảo vệ route với AuthGuard

**Ví dụ bảo vệ UserController hoặc route cụ thể:**
- Thêm `@UseGuards(AuthGuard('jwt'))` lên controller hoặc method.
- Request phải có header: `Authorization: Bearer <token>`.
- Nếu không có hoặc token invalid → 401.

**Public routes:**
- Login, Register, health check → không dùng Guard.
- Có thể tạo decorator `@Public()` và trong `APP_GUARD` bỏ qua các route có decorator này.

**Bài học:**
- Mặc định nên "opt-in" bảo vệ: chỉ route cần auth mới gắn Guard. Hoặc "opt-out": dùng global Guard và đánh dấu `@Public()` cho route public.
- Tránh lộ token qua URL (query) – chỉ dùng header.

---

### Bước 10: Environment & Security

**Biến môi trường cần:**
- `JWT_SECRET` – chuỗi bí mật, đủ dài (ví dụ 32+ ký tự random).
- Không commit `.env` vào git.

**Swagger:**
- Thêm Bearer auth vào Swagger config (đã có `addBearerAuth()`).
- Dùng `@ApiBearerAuth()` trên controller/method được bảo vệ để hiện nút Authorize.

---

## 4. Checklist triển khai

Đánh dấu khi hoàn thành từng bước:

- [ ] Bước 1: Cài dependencies
- [ ] Bước 2: DTOs & Interfaces
- [ ] Bước 3: JWT Module config
- [ ] Bước 4: AuthService login logic
- [ ] Bước 5: LocalStrategy (optional)
- [ ] Bước 6: JwtStrategy
- [ ] Bước 7: AuthController
- [ ] Bước 8: AuthModule & AppModule
- [ ] Bước 9: Gắn AuthGuard lên route cần bảo vệ
- [ ] Bước 10: JWT_SECRET và Swagger

---

## 5. Cấu trúc thư mục gợi ý

```
src/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── local.strategy.ts   # optional
├── dto/
│   └── login.dto.ts
├── guards/
│   └── jwt-auth.guard.ts   # optional, wrapper
└── interfaces/
    └── auth.interface.ts
```

---

## 6. Debugging Tips

| Vấn đề | Nguyên nhân có thể | Cách kiểm tra |
|--------|--------------------|---------------|
| 401 khi gửi token | Sai secret, token hết hạn, format header sai | Kiểm tra header `Authorization: Bearer <token>`, JWT_SECRET, expiresIn |
| Login chậm | bcrypt rounds quá cao | Dùng 10–12 rounds |
| "Cannot resolve dependency" | Thiếu import module, provider | Kiểm tra AuthModule imports, PrismaModule |
| Token không được gửi | Client chưa gửi header | Kiểm tra client code, Swagger Authorize |
| CORS | Origin không được cho phép | Kiểm tra `enableCors()` trong main.ts |

---

## 7. Bài học tổng kết

1. **Auth ≠ User**: Auth xử lý login + bảo vệ route; User xử lý CRUD user.
2. **JWT stateless**: Không lưu session, dễ scale.
3. **Security**: Dùng env cho secret, thông báo lỗi login chung, bcrypt rounds hợp lý.
4. **Thứ tự**: Config → Service → Strategy → Controller → Guard.
5. **Passport**: Strategy + Guard là cặp đôi – Strategy validate, Guard quyết định route có được truy cập không.
6. **Testing**: Dùng route `/auth/profile` + Bearer token để test flow end-to-end.

---

## 8. Tài liệu tham khảo

- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [NestJS JWT](https://docs.nestjs.com/security/authentication#jwt-token)
- [Passport.js](http://www.passportjs.org/)
- [JWT.io](https://jwt.io/) – decode và xem payload

---

## Kết luận

Làm từng bước, test sau mỗi bước (ví dụ: login trả token → gọi profile với token). Khi gặp lỗi, dùng checklist và debugging tips trên để khoanh vùng nguyên nhân. Chúc bạn implement thành công.
