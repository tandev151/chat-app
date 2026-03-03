import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  controllers: [UserController], // Đăng ký controller
  providers: [UserService], // Đăng ký service
  exports: [UserService], // Export service để module khác có thể dùng
})
export class UserModule {}
