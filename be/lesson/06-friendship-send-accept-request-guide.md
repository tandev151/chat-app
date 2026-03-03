# Friendship Module – Send Request & Accept Request (Lesson Guide)

## 1. Tổng quan

Bài học này hướng dẫn thiết kế và implement 2 API chính:
1. **Send request** – Gửi lời mời kết bạn
2. **Accept request** – Chấp nhận lời mời kết bạn

Thực hiện **đọc và nắm rõ** trước khi code.

---

## 2. Data Model Hiện Tại

```
FriendShipRequest
- id
- requestUserId   → User (người gửi)
- addresseeId     → User (người nhận)
- status          → PENDING | ACCEPTED | REJECTED | CANCELLED | EXPIRED
- createdAt
- respondedAt

@@unique([requestUserId, addresseeId])
```

**Lưu ý:** Hiện chưa có bảng `Friendship`. Khi status = ACCEPTED, hai người được coi là bạn. Danh sách bạn = các `FriendShipRequest` có status ACCEPTED và (userId = requestUserId hoặc addresseeId). Có thể thêm bảng `Friendship` sau nếu cần tách rõ hơn.

---

## 3. API Design

### 3.1 Send Request

| | Chi tiết |
|---|----------|
| **Method** | POST |
| **Path** | `/friends/requests` hoặc `/friends/request` |
| **Auth** | Bearer token (bắt buộc) |
| **Body** | `{ "addresseeId": "uuid" }` |
| **Response** | 201 Created + FriendShipRequest object |
| **Ý nghĩa** | User đăng nhập (requester) gửi lời mời tới addresseeId |

### 3.2 Accept Request

| | Chi tiết |
|---|----------|
| **Method** | POST hoặc PATCH |
| **Path** | `/friends/requests/:id/accept` hoặc `/friends/accept` |
| **Auth** | Bearer token (bắt buộc) |
| **Body** | Không cần (id trong path) hoặc `{ "requestId": "uuid" }` |
| **Response** | 200 OK + FriendShipRequest (status ACCEPTED) |
| **Ý nghĩa** | User đăng nhập (addressee) chấp nhận lời mời có id = :id |

---

## 4. Validation Rules & Edge Cases

### 4.1 Send Request

| Rule | Mô tả | HTTP |
|------|-------|------|
| **addresseeId phải tồn tại** | User nhận phải có trong DB | 404 |
| **Không gửi cho chính mình** | requestUserId ≠ addresseeId | 400 |
| **Không spam** | Cặp (requester, addressee) chưa có record PENDING | 400 |
| **Không gửi lại nếu đã ACCEPTED** | Đã là bạn rồi thì không gửi request nữa | 400 |
| **Có thể gửi lại sau REJECTED/CANCELLED** | (tùy product) thường cho phép gửi lại | - |
| **addresseeId format** | UUID hợp lệ | 400 |

### 4.2 Accept Request

| Rule | Mô tả | HTTP |
|------|-------|------|
| **Request phải tồn tại** | id hợp lệ, record có trong DB | 404 |
| **Chỉ addressee mới accept** | addresseeId = currentUserId | 403 |
| **Status phải PENDING** | Chỉ accept khi status = PENDING | 400 |
| **Id format** | UUID hợp lệ | 400 |

---

## 5. Authorization

### 5.1 Ai làm được gì

| Action | Ai được phép |
|--------|--------------|
| Send request | Chỉ user đăng nhập (requester) |
| Accept request | Chỉ addressee của request đó |
| Reject request | Chỉ addressee |
| Cancel request | Chỉ requester |
| List requests sent | Chỉ requester |
| List requests received | Chỉ addressee |

### 5.2 Implementation

- Dùng **JwtAuthGuard** (hoặc AuthGuard('jwt')) cho toàn bộ Friendship endpoints.
- Lấy `currentUserId` từ `request.user` (sau khi JwtStrategy validate token).
- Tạo decorator `@CurrentUser()` để inject user vào controller:  
  `@CurrentUser() user: { userId: string }`

---

## 6. Service Logic (Pseudo-code)

### 6.1 Send Request

```
1. Lấy currentUserId từ token
2. Validate addresseeId (IsUUID, IsNotEmpty)
3. Kiểm tra addresseeId ≠ currentUserId → 400
4. Tìm addressee trong DB → nếu không có → 404
5. Tìm FriendShipRequest (requestUserId, addresseeId) – hoặc (addresseeId, requestUserId) nếu bidirectional
   - Nếu có PENDING → 400 "Request already sent"
   - Nếu có ACCEPTED → 400 "Already friends"
   - Nếu có REJECTED/CANCELLED → (tùy) cho phép tạo mới hoặc 400
6. Tạo FriendShipRequest:
   - requestUserId = currentUserId
   - addresseeId = addresseeId
   - status = PENDING
7. Return 201 + request object
```

### 6.2 Accept Request

```
1. Lấy currentUserId từ token
2. Tìm FriendShipRequest theo id
   - Không có → 404
3. Kiểm tra addresseeId === currentUserId → nếu không → 403
4. Kiểm tra status === PENDING → nếu không → 400 "Request already responded"
5. Cập nhật: status = ACCEPTED, respondedAt = now()
6. (Optional) Nếu có bảng Friendship → tạo 2 records (A↔B)
7. Return 200 + updated request
```

---

## 7. DTOs & Interfaces

### 7.1 SendRequestDto

- `addresseeId: string` – UUID
- Validation: `@IsUUID()`, `@IsNotEmpty()`
- ApiProperty cho Swagger

### 7.2 AcceptRequestDto (nếu dùng body)

- Có thể không cần – id lấy từ path `:id`
- Hoặc `requestId` nếu dùng `POST /friends/accept` với body

### 7.3 Response Interface

- `FriendShipRequestResponse`: id, requestUserId, addresseeId, status, createdAt, respondedAt
- Có thể include `requester` và `addressee` (user info) khi cần

---

## 8. Error Messages (Gợi ý)

| Tình huống | Message |
|------------|---------|
| Gửi cho chính mình | "Cannot send friend request to yourself" |
| Đã gửi PENDING | "Friend request already sent" |
| Đã là bạn (ACCEPTED) | "Already friends" |
| addressee không tồn tại | "User not found" |
| Request không tồn tại | "Friend request not found" |
| Không phải addressee | "You can only accept requests sent to you" |
| Đã respond (không còn PENDING) | "Request already responded" |

---

## 9. HTTP Status Codes

| Status | Dùng khi |
|--------|----------|
| 201 | Send request thành công |
| 200 | Accept request thành công |
| 400 | Validation, business rule (tự gửi, đã gửi, đã bạn, v.v.) |
| 401 | Chưa đăng nhập |
| 403 | Không có quyền (vd: accept request của người khác) |
| 404 | User/Request không tồn tại |

---

## 10. Thứ Tự Implement

1. **Chuẩn bị**
   - JwtAuthGuard + JwtStrategy (nếu chưa có)
   - Decorator @CurrentUser()
   - Import FriendShipModule vào AppModule

2. **DTOs**
   - SendRequestDto
   - (Optional) Response interface

3. **Service**
   - sendRequest(currentUserId, addresseeId)
   - acceptRequest(currentUserId, requestId)

4. **Controller**
   - POST /friends/requests – send
   - POST /friends/requests/:id/accept – accept

5. **Test**
   - Send: success, self, duplicate, already friends
   - Accept: success, not addressee, already responded

---

## 11. Cấu Trúc Thư Mục Gợi Ý

```
friend-ship/
├── friend-ship.module.ts
├── friend-ship.controller.ts
├── friend-ship.service.ts
├── dto/
│   ├── send-request.dto.ts
│   └── (accept có thể dùng param :id, không cần DTO)
└── interfaces/
    └── friendship-request.interface.ts
```

---

## 12. Checklist Trước Khi Code

- [ ] Đã có JwtAuthGuard và có thể lấy currentUserId
- [ ] Đã nắm rõ các edge case (self, duplicate, already friends)
- [ ] Đã định nghĩa DTOs và validation
- [ ] Đã chọn path và HTTP method
- [ ] Đã xác định response format
- [ ] Đã biết khi nào trả 400, 403, 404

---

## 13. Bài Học Tóm Tắt

| # | Bài học |
|---|---------|
| 1 | Kiểm tra đủ edge case trước khi code – self, duplicate, already friends |
| 2 | Authorization rõ ràng: chỉ addressee accept, chỉ requester cancel |
| 3 | Dùng UUID validation cho id, tránh invalid format |
| 4 | Message lỗi rõ ràng giúp client xử lý đúng |
| 5 | @CurrentUser() giúp controller gọn, dễ test |
| 6 | Service chứa business logic, controller chỉ gọi service và trả response |
