# Báo cáo anti-pattern: `lib/api/client.ts`

## 1. Bằng chứng: `auth` trong `createApiClient` luôn = null và client mặc định không có interceptors

### 1.1 Thứ tự thực thi (order of execution)

- **Khi nào `apiClient` được tạo?**  
  Khi module `client.ts` được import lần đầu (ví dụ từ `friend.ts`, `auth.ts`, `users.ts`). Lúc đó **ngay lập tức** chạy:

  ```ts
  export const apiClient = createApiClient({ baseURL: config.apiBaseUrl });
  ```

- **Khi nào `setAuthCallbacks` được gọi?**  
  Chỉ trong `AuthProvider` (auth-context.tsx), bên trong **`useEffect`** — tức là **sau khi** component mount và React chạy effect. Điều này xảy ra **sau** khi cây component đã render, tức là **sau** mọi lần import module và khởi tạo `apiClient`.

Kết luận: **Tại thời điểm `createApiClient` chạy để tạo `apiClient`, `setAuthCallbacks` chưa bao giờ được gọi** → `globalAuthCallbacks` vẫn là `null`.

### 1.2 Logic `getAuthForClient`

Trong `client.ts`:

```ts
const getAuthForClient = (
  options: CreateApiClientOptions,
): AuthCallbacks | null => {
  if (options.auth === null) return null;
  return options.auth ?? globalAuthCallbacks;
};
```

Với default client:

- Gọi: `createApiClient({ baseURL: config.apiBaseUrl })` → `opts.auth` là **`undefined`** (không truyền).
- `options.auth === null` → false.
- `options.auth ?? globalAuthCallbacks` → `undefined ?? null` → **`null`**.

Vậy **`auth` luôn bằng `null`** khi tạo default `apiClient`.

### 1.3 Khối `if (auth)` không bao giờ chạy cho default client

```ts
if (auth) {
  instance.interceptors.request.use(attachAuth(auth.getAccessToken));
  instance.interceptors.response.use(
    (res) => res,
    createUnauthorizedInterceptor(instance, auth.onUnauthorized),
  );
}
```

Vì `auth === null` tại thời điểm tạo `apiClient`, khối này **không được thực thi** → **default `apiClient` không có request/response interceptor** (không gắn access token, không xử lý 401/refresh).

### 1.4 Sau này gọi `setAuthCallbacks` cũng không sửa được instance cũ

`setAuthCallbacks` chỉ gán `globalAuthCallbacks = cbs`. Instance `apiClient` đã được tạo **một lần** và không có cơ chế nào “đăng ký lại” interceptors cho instance đó. Vì vậy **dù sau đó có set callbacks, default `apiClient` vẫn không có interceptors**.

---

## 2. Các anti-pattern trong file này (bằng tiếng Việt)

### 2.1 Khởi tạo client mặc định ngay khi load module (eager singleton)

- **Vấn đề:** `apiClient` được tạo tại thời điểm import module, trong khi auth callbacks chỉ có sau khi `AuthProvider` mount (useEffect). Dẫn đến client mặc định **luôn** được tạo với `auth = null` và không có interceptors.
- **Hậu quả:** Mọi request dùng `apiClient` (friend, users, auth sau login…) **không** tự gắn header Authorization và **không** xử lý 401/refresh token.
- **Hướng xử lý:** Không export sẵn một instance cố định; chỉ export factory `createApiClient` và một getter (lazy) lấy client “main API” **sau khi** đã gọi `setAuthCallbacks`, hoặc đăng ký interceptors động khi set callbacks (xem 2.3).

### 2.2 Phụ thuộc ngầm vào thứ tự khởi tạo (initialization order)

- **Vấn đề:** Code giả định “global auth callbacks sẽ được set trước khi ai đó dùng api client”. Trên thực tế callbacks được set trong React lifecycle (useEffect), còn api client được tạo ở module load — thứ tự không thể đảm bảo.
- **Hậu quả:** Dễ lỗi khó đoán (request không có token, 401 không refresh) và khó debug vì phụ thuộc thứ tự load/render.
- **Hướng xử lý:** Tránh “global callback + client tạo sẵn”; dùng lazy client hoặc inject auth vào client tại nơi biết chắc auth đã sẵn sàng.

### 2.3 Global state ẩn (globalAuthCallbacks) không đồng bộ với instance đã tạo

- **Vấn đề:** `globalAuthCallbacks` là biến module ẩn; `setAuthCallbacks` chỉ cập nhật biến này, **không** cập nhật lại các axios instance đã được tạo trước đó. Instance `apiClient` đã “đóng” với `auth = null` và không bao giờ nhận interceptors.
- **Hậu quả:** Thiết kế “set callbacks để main API dùng auth” không đạt mục đích với default `apiClient`.
- **Hướng xử lý:** Hoặc (a) không tạo sẵn default client, chỉ tạo client khi đã có callbacks, hoặc (b) khi gọi `setAuthCallbacks` thì cập nhật/đăng ký interceptors cho (các) instance đã tồn tại (nếu vẫn muốn dùng singleton).

### 2.4 API surface gây hiểu nhầm

- **Vấn đề:** Comment và JSDoc nói “Default client for the main API. Uses global auth set via setAuthCallbacks” — trên thực tế default client **không** dùng được global auth vì được tạo trước khi callbacks được set và không có cơ chế gắn interceptors sau.
- **Hậu quả:** Người đọc/doc tin rằng chỉ cần gọi `setAuthCallbacks` là `apiClient` sẽ có auth; thực tế không đúng.
- **Hướng xử lý:** Sửa code để đúng với mục đích (lazy client hoặc đăng ký interceptors khi set callbacks), đồng thời cập nhật comment/doc cho khớp hành vi thực tế.

---

## 3. Tóm tắt

| Nội dung                             | Kết luận                                                                                                                                |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `auth` khi tạo default `apiClient`   | Luôn `null` (vì `opts.auth` undefined và `globalAuthCallbacks` chưa được set lúc load module).                                          |
| Default `apiClient` có interceptors? | Không — khối `if (auth)` không chạy.                                                                                                    |
| Nguyên nhân                          | Client tạo tại module load; callbacks set sau trong `useEffect` của AuthProvider; không có cơ chế gắn interceptors sau cho instance cũ. |

Cần refactor để default API client thực sự dùng được auth (lazy creation hoặc đăng ký interceptors khi `setAuthCallbacks`).

---

## 4. Kế hoạch sửa từng bước (tiếng Việt)

### Hướng chọn: Gắn interceptors khi gọi `setAuthCallbacks` (đồng bộ instance với callbacks)

Không đổi cách dùng: vẫn export `apiClient` và gọi `setAuthCallbacks` trong `AuthProvider`. Khi `setAuthCallbacks` chạy, ta **gắn luôn** request/response interceptors vào default client đã tạo sẵn, nhờ đó client mặc định có auth đúng như mong đợi.

---

### Bước 1: Tạo default client thủ công, không qua `createApiClient`

- **Mục tiêu:** Default client vẫn là một axios instance tạo sớm (để mọi nơi import `apiClient` không đổi), nhưng tách riêng khỏi `createApiClient` để ta kiểm soát được reference.
- **Làm:** Trong `client.ts`, tạo default instance bằng `axios.create({ baseURL, headers })` và lưu vào biến nội bộ (ví dụ `defaultApiInstance`). Export `apiClient` trỏ tới biến đó. Không gọi `createApiClient` cho default client nữa.
- **Kết quả:** Default client tồn tại ngay khi load module, chưa có interceptors; sau bước 2 sẽ được gắn khi `setAuthCallbacks` chạy.

### Bước 2: Trong `setAuthCallbacks`, gắn interceptors vào default client

- **Mục tiêu:** Đồng bộ global auth với instance: khi AuthProvider gọi `setAuthCallbacks`, default client nhận request interceptor (gắn token) và response interceptor (xử lý 401/refresh).
- **Làm:** Trong `setAuthCallbacks(cbs)`: lấy default instance (biến nội bộ), gọi `instance.interceptors.request.use(attachAuth(cbs.getAccessToken))` và `instance.interceptors.response.use(..., createUnauthorizedInterceptor(instance, cbs.onUnauthorized))`. Dùng một flag (ví dụ `defaultClientAuthAttached`) để **chỉ gắn một lần**, tránh khi React Strict Mode chạy effect hai lần thì bị gắn trùng interceptors.
- **Kết quả:** Sau khi AuthProvider mount và effect chạy, mọi request qua `apiClient` có header Authorization và 401 sẽ trigger refresh.

### Bước 3: Dọn dẹp và cập nhật comment

- **Mục tiêu:** Code sạch, comment đúng hành vi.
- **Làm:** Xóa import không dùng trong `client.ts` (nếu có). Cập nhật JSDoc/comment cho default client: “Client mặc định; auth được gắn khi gọi setAuthCallbacks (thường trong AuthProvider).”
- **Kết quả:** Không còn API surface gây hiểu nhầm (anti-pattern 2.4).

### Bước 4: Kiểm tra thành công

- **Mục tiêu:** Xác nhận sửa đúng, không gây lỗi.
- **Làm:** Chạy build (ví dụ `npm run build` hoặc `pnpm build`). Nếu có test cho API/auth thì chạy test. Tự kiểm tra nhanh: login → request (ví dụ danh sách bạn) → kiểm tra Network tab có header Authorization và 401 có refresh.
- **Kết quả:** Build pass, hành vi auth đúng như mô tả trong doc.

---

### Tóm tắt thứ tự thực hiện

| Bước | Nội dung                                                                                            | File chính          |
| ---- | --------------------------------------------------------------------------------------------------- | ------------------- |
| 1    | Tạo default client bằng `axios.create`, lưu nội bộ, export `apiClient`                              | `lib/api/client.ts` |
| 2    | Trong `setAuthCallbacks` gắn request/response interceptors cho default client (có flag gắn một lần) | `lib/api/client.ts` |
| 3    | Dọn import thừa, sửa comment/JSDoc                                                                  | `lib/api/client.ts` |
| 4    | Build + kiểm tra hành vi auth                                                                       | —                   |
