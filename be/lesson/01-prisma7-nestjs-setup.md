# Lessons Learned: Prisma 7 + NestJS Setup

## Tổng quan

Tài liệu này tổng hợp các bài học và kinh nghiệm từ việc setup NestJS backend với Prisma 7, đặc biệt là các vấn đề về module system, dependency injection, và Prisma 7 configuration.

---

## 1. Module System: CommonJS vs ES Modules

### Vấn đề gặp phải

- Ban đầu project được cấu hình với `"module": "nodenext"` trong `tsconfig.json`
- Prisma client generate ra CommonJS code nhưng được load trong ES Module context
- Lỗi: `ReferenceError: exports is not defined in ES module scope`

### Nguyên nhân

- **CommonJS** và **ES Modules** là 2 hệ thống module khác nhau trong JavaScript/Node.js
- CommonJS dùng `require()` và `module.exports`
- ES Modules dùng `import` và `export`
- NestJS được thiết kế chủ yếu cho **CommonJS** (chuẩn của cộng đồng)

### Giải pháp

**Cấu hình `tsconfig.json` cho CommonJS:**

```json
{
  "compilerOptions": {
    "module": "commonjs",  // ← Đổi từ "nodenext" sang "commonjs"
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

**Đảm bảo `package.json` không có:**

```json
{
  // ❌ KHÔNG thêm dòng này
  // "type": "module"
}
```

### Bài học

1. **NestJS nên dùng CommonJS** - đây là chuẩn được cộng đồng sử dụng rộng rãi
2. **Prisma client hoạt động tốt với CommonJS** - không cần ES Modules
3. **Không cần thêm `.js` extension** vào imports khi dùng CommonJS
4. **Kiểm tra `tsconfig.json`** trước khi bắt đầu project mới

---

## 2. Dependency Injection trong NestJS

### Vấn đề gặp phải

- Lỗi: `Nest can't resolve dependencies of the UserService (?). Please make sure that the argument PrismaService at index [0] is available in the UserModule context.`

### Nguyên nhân

- `PrismaModule` được đánh dấu `@Global()` nhưng **không được import** vào `AppModule`
- NestJS không biết về `PrismaModule` → không khởi tạo `PrismaService` → không thể inject vào `UserService`

### Giải pháp

**Import PrismaModule vào AppModule:**

```ts
// app.module.ts
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,  // ← Phải import module này
    UserModule,
    // ...
  ],
})
export class AppModule {}
```

**Cấu trúc PrismaModule:**

```ts
// prisma.module.ts
@Global()  // ← Cho phép PrismaService được inject ở mọi module
@Module({
  providers: [PrismaService],
  exports: [PrismaService],  // ← Export để module khác dùng
})
export class PrismaModule {}
```

### Bài học

1. **`@Global()` không có nghĩa là tự động import** - vẫn phải import module vào `AppModule`
2. **`@Global()` chỉ làm cho service có sẵn** sau khi module đã được import
3. **Luôn kiểm tra imports** trong `AppModule` khi gặp lỗi dependency injection
4. **Thứ tự import không quan trọng** - NestJS tự động resolve dependencies

---

## 3. Prisma 7 Configuration Changes

### Vấn đề gặp phải

- Lỗi: `PrismaClient needs to be constructed with a non-empty, valid PrismaClientOptions`
- Lỗi: `The datasource property 'url' is no longer supported in schema files`

### Nguyên nhân

**Prisma 7 đã thay đổi cách cấu hình:**

1. **`url` không còn được hỗ trợ trong `schema.prisma`**
   - Phải di chuyển sang `prisma.config.ts` (cho CLI)
   - Phải pass adapter vào `PrismaClient` constructor (cho runtime)

2. **Prisma 7 yêu cầu adapter** khi dùng `prisma-client` provider
   - Không thể chỉ pass string URL
   - Phải tạo adapter instance từ adapter package

### Giải pháp

**Bước 1: Cấu hình `schema.prisma`**

```prisma
datasource db {
  provider = "postgresql"
  // ❌ KHÔNG có url ở đây nữa
}
```

**Bước 2: Cấu hình `prisma.config.ts` (cho CLI)**

```ts
// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],  // ← Cho Prisma CLI
  },
});
```

**Bước 3: Cài adapter packages**

```bash
pnpm add @prisma/adapter-pg pg
```

**Bước 4: Cấu hình PrismaService (cho runtime)**

```ts
// prisma.service.ts
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const connectionString = process.env.DATABASE_URL!;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    
    super({ adapter });  // ← Pass adapter vào constructor
  }
}
```

### Bài học

1. **Prisma 7 có breaking changes** - cần đọc migration guide khi upgrade
2. **`prisma.config.ts` dùng cho CLI** - migrate, generate, studio
3. **PrismaClient constructor cần adapter** - không thể chỉ pass URL string
4. **Adapter phải là instance** - không phải string hoặc object đơn giản
5. **Luôn cài adapter package** - `@prisma/adapter-pg` cho PostgreSQL

---

## 4. File Structure và Best Practices

### Cấu trúc thư mục đúng

```
be/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Migration files
│   ├── prisma.module.ts       # Prisma module
│   └── prisma.service.ts      # Prisma service
├── prisma.config.ts           # Prisma CLI config
├── generated/
│   └── prisma/                # Generated Prisma client
├── src/
│   ├── user/
│   │   ├── dto/               # Data Transfer Objects
│   │   ├── interfaces/        # TypeScript interfaces
│   │   ├── user.module.ts
│   │   ├── user.service.ts
│   │   └── user.controller.ts
│   └── app.module.ts
└── .env                       # Environment variables
```

### Best Practices

1. **Tách biệt concerns:**
   - DTOs cho input validation
   - Interfaces cho output types
   - Services cho business logic
   - Controllers cho HTTP handling

2. **Module organization:**
   - Mỗi domain có module riêng
   - Global modules (như PrismaModule) import vào AppModule
   - Export services cần dùng ở module khác

3. **Environment variables:**
   - Luôn dùng `.env` file
   - Load `.env` bằng `dotenv/config` hoặc `ConfigModule`
   - Không commit `.env` vào git

4. **Prisma setup:**
   - `schema.prisma` chỉ định nghĩa models
   - `prisma.config.ts` cấu hình cho CLI
   - `PrismaService` cấu hình adapter cho runtime

---

## 5. Common Mistakes và Cách Tránh

### Mistake 1: Quên import Global Module

**Lỗi:** Dependency injection không hoạt động

**Cách tránh:** Luôn import global modules vào `AppModule`

### Mistake 2: Nhầm lẫn Module System

**Lỗi:** ES Module errors với CommonJS code

**Cách tránh:** Dùng CommonJS cho NestJS projects

### Mistake 3: Prisma 7 Configuration

**Lỗi:** PrismaClient không khởi tạo được

**Cách tránh:** 
- Xóa `url` khỏi `schema.prisma`
- Thêm vào `prisma.config.ts`
- Pass adapter vào PrismaClient constructor

### Mistake 4: Quên Load Environment Variables

**Lỗi:** `DATABASE_URL` is undefined

**Cách tránh:** Luôn import `dotenv/config` hoặc dùng `ConfigModule`

---

## 6. Debugging Tips

### Khi gặp Dependency Injection Error

1. Kiểm tra module đã được import vào `AppModule` chưa
2. Kiểm tra service đã được export từ module chưa
3. Kiểm tra `@Global()` decorator có đúng không
4. Kiểm tra constructor injection syntax

### Khi gặp Prisma Error

1. Kiểm tra `DATABASE_URL` trong `.env`
2. Kiểm tra `schema.prisma` có đúng syntax không
3. Kiểm tra adapter đã được cấu hình đúng chưa
4. Chạy `pnpm prisma generate` để regenerate client

### Khi gặp Module System Error

1. Kiểm tra `tsconfig.json` - `module` phải là `"commonjs"`
2. Kiểm tra `package.json` - không có `"type": "module"`
3. Kiểm tra imports không có `.js` extension (CommonJS)

---

## 7. Key Takeaways

1. **NestJS + CommonJS** là combination chuẩn và ổn định nhất
2. **Prisma 7 có breaking changes** - cần đọc docs kỹ khi upgrade
3. **Dependency Injection** cần module được import vào AppModule
4. **Global modules** vẫn cần import, chỉ là làm cho service có sẵn sau đó
5. **Adapter pattern** trong Prisma 7 yêu cầu instance, không phải string
6. **Environment variables** cần được load trước khi app khởi động
7. **File structure** quan trọng - giúp code dễ maintain và scale

---

## 8. Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Prisma Adapters](https://www.prisma.io/docs/orm/overview/databases/database-drivers)
- [CommonJS vs ES Modules](https://nodejs.org/api/modules.html)

---

## Kết luận

Quá trình setup này đã dạy chúng ta về:
- Tầm quan trọng của việc hiểu module system
- Cách NestJS dependency injection hoạt động
- Breaking changes trong Prisma 7 và cách xử lý
- Best practices cho project structure

Những bài học này sẽ giúp tránh được các lỗi tương tự trong tương lai và setup project nhanh hơn.
