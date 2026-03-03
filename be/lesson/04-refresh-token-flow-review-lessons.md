# Refresh Token Flow – Review & Lessons Learned

## 1. Review Implementation

### Điểm tốt ✓

| Hạng mục | Chi tiết |
|----------|----------|
| **Controller** | `POST /auth/refresh-token`, dùng `RefreshTokenDto`, gọi service đúng |
| **DTO** | `RefreshTokenDto` với `@IsJWT()`, `@IsNotEmpty()` – validate format trước khi vào service |
| **Flow** | Verify → check type → fetch user → trả token mới |
| **Refresh Token Rotation** | Mỗi lần refresh trả cả accessToken và refreshToken mới – đúng hướng |
| **Swagger** | Có `@ApiResponse` cho 200 và 401 |
| **Phân biệt type** | Kiểm tra `decoded.type === 'refresh'` để tránh dùng accessToken làm refresh |

### Điểm cần cải thiện

| Vấn đề | Chi tiết |
|--------|----------|
| **JWT verify error** | `jwtService.verify()` throw khi expired/malformed – chưa catch → client nhận 500 thay vì 401 |
| **Thông báo lỗi** | `NotFoundException('User not found')` trong refresh – có thể trả UnauthorizedException chung |
| **expiresIn trong payload** | `expiresIn` trong `sign({...})` không ảnh hưởng JWT – cần truyền vào options: `sign(payload, { expiresIn: '15m' })` |
| **Swagger example** | `example: 'refresh_token'` không đúng format JWT |
| **Import không dùng** | `Type` trong controller có thể không cần |

---

## 2. Bài học 1: Bắt lỗi từ JWT verify

### 2.1 Vấn đề

`jwtService.verify(refreshToken)` ném lỗi khi:
- Token hết hạn
- Token sai format / bị sửa
- Sai secret

Nếu không catch, NestJS trả **500 Internal Server Error** – không chuẩn với API auth.

### 2.2 Cách xử lý

Wrap trong try-catch và trả **401 Unauthorized** với message chung:

```ts
try {
  const decoded = this.jwtService.verify(refreshToken);
  // ... logic
} catch {
  throw new UnauthorizedException('Invalid or expired refresh token');
}
```

### 2.3 Lý do dùng message chung

- Không phân biệt "expired" vs "invalid" – tránh leak thông tin
- Client luôn biết: token không dùng được → cần login lại
- Phù hợp OWASP: tránh enum qua error message

---

## 3. Bài học 2: expiresIn – payload vs sign options

### 3.1 Sai lầm phổ biến

```ts
// ❌ SAI – expiresIn trong payload KHÔNG điều khiển thời hạn JWT
this.jwtService.sign({
  userId: user.id,
  type: 'access',
  expiresIn: 15 * 60,  // Chỉ là data trong payload, JWT vẫn dùng default
})
```

`expiresIn` trong payload chỉ là field tùy ý, JWT library không dùng nó để set `exp`.

### 3.2 Cách đúng

```ts
// ✓ ĐÚNG – expiresIn là option của sign()
this.jwtService.sign(
  { userId: user.id, type: 'access' },
  { expiresIn: '15m' }
)
```

### 3.3 Gợi ý thời hạn

- **accessToken**: `'15m'` hoặc `'1h'`
- **refreshToken**: `'7d'` hoặc `'30d'`

---

## 4. Bài học 3: Refresh Token Rotation & Security

### 4.1 Refresh Token Rotation

Bạn đang làm đúng: mỗi lần refresh trả cả accessToken và refreshToken mới.

**Lợi ích:**
- Giảm thời gian token bị lạm dụng nếu lộ
- Token cũ không dùng được nữa sau khi đã refresh

### 4.2 Nâng cao: Invalidate token cũ (optional)

Trong mô hình rotation mạnh hơn:
- Lưu `jti` (JWT ID) của refresh token đã dùng vào blacklist/cache
- Khi nhận refresh, kiểm tra `jti` chưa nằm trong blacklist
- Sau khi trả token mới, đưa `jti` cũ vào blacklist

Với JWT stateless đơn giản thì có thể chưa cần, nhưng nên biết pattern này.

### 4.3 Naming: refresh-token vs refresh

- `POST /auth/refresh-token` ✓ – rõ ràng
- `POST /auth/refresh` – ngắn gọn, cũng phổ biến

Cả hai đều ổn, quan trọng là thống nhất trong toàn bộ API.

---

## 5. Bài học 4: Error handling thống nhất trong Auth

### 5.1 Nguyên tắc

Auth endpoints nên trả **401 Unauthorized** cho mọi lỗi liên quan token/credentials, không leak chi tiết.

### 5.2 So sánh

| Trường hợp | Không nên | Nên |
|------------|-----------|-----|
| Token expired | 500 (do throw không catch) | 401 "Invalid or expired refresh token" |
| Token invalid | 500 | 401 "Invalid or expired refresh token" |
| User bị xóa sau khi có token | 404 "User not found" | 401 "Invalid or expired refresh token" |
| Sai type (access thay vì refresh) | 401 ✓ | 401 ✓ |

### 5.3 Lý do

- Client chỉ cần biết: auth thất bại → redirect login
- Tránh cho attacker biết token còn hợp lệ hay đã hết hạn, user có tồn tại hay không

---

## 6. Bài học 5: DTO & Swagger cho Refresh

### 6.1 RefreshTokenDto

- `@IsJWT()` – validate format JWT sơ bộ
- `@IsNotEmpty()` – bắt buộc có giá trị
- Thứ tự: `@IsNotEmpty()` trước `@IsJWT()` để tránh validate chuỗi rỗng

### 6.2 Swagger example

```ts
// ❌ Dễ gây hiểu nhầm
example: 'refresh_token'

// ✓ Gợi ý
example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
// hoặc
example: 'JWT token from login/refresh response'
```

Example nên phản ánh đúng kiểu dữ liệu client gửi (JWT string).

---

## 7. Checklist cải thiện Refresh Flow

- [ ] Bắt lỗi từ `jwtService.verify()` → trả 401 thay vì 500
- [ ] Dùng `sign(payload, { expiresIn: '15m' })` cho accessToken
- [ ] Dùng `sign(payload, { expiresIn: '7d' })` cho refreshToken
- [ ] User không tồn tại → UnauthorizedException (không NotFoundException)
- [ ] Cập nhật Swagger example cho refreshToken
- [ ] Xóa import không dùng (ví dụ `Type`)

---

## 8. Tóm tắt Lessons

| # | Bài học |
|---|---------|
| 1 | Luôn catch lỗi từ `jwtService.verify()` và trả 401 với message chung |
| 2 | `expiresIn` phải truyền vào options của `sign()`, không đặt trong payload |
| 3 | Refresh Token Rotation (trả token mới mỗi lần refresh) là best practice |
| 4 | Auth errors: thống nhất 401, không leak thông tin qua 404/500 |
| 5 | DTO + Swagger example phải phản ánh đúng format JWT |
