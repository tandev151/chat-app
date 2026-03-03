# Lessons Learned

Thư mục này chứa các bài học và kinh nghiệm từ quá trình phát triển project.

## Cấu trúc

Mỗi lesson được đánh số và đặt tên theo chủ đề:

- `01-prisma7-nestjs-setup.md` - Bài học về setup Prisma 7 với NestJS
- `02-auth-module-step-by-step-guide.md` - Hướng dẫn từng bước xây dựng Auth module (JWT, Passport, Guards)
- `03-auth-review-lessons.md` - Review Auth module & bài học: accessToken vs refreshToken, Guard vs Middleware
- `04-refresh-token-flow-review-lessons.md` - Review Refresh Token flow & bài học: JWT verify errors, expiresIn, error handling
- `05-social-platform-architecture-design.md` - Thiết kế kiến trúc chuẩn: Friend, Channel, API, Data model
- `06-friendship-send-accept-request-guide.md` - Hướng dẫn Send Request & Accept Request: validation, edge cases, authorization

## Quy ước đặt tên

- Format: `NN-topic-description.md`
- `NN`: Số thứ tự (01, 02, 03...)
- `topic`: Chủ đề chính (ví dụ: prisma7, auth, websocket...)
- `description`: Mô tả ngắn gọn

## Mục đích

Các lesson này giúp:
- Ghi lại kinh nghiệm và bài học từ các vấn đề đã gặp
- Tham khảo khi gặp vấn đề tương tự
- Chia sẻ kiến thức với team
- Tránh lặp lại các lỗi đã gặp
