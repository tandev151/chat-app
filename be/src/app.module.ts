import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChannelModule } from './channel/channel.module';
import { ChatModule } from './chat/chat.module';
import { MessageModule } from './message/message.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from 'prisma/prisma.module';
import { FriendModule } from './friend/friend.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuthModule,
    ChannelModule,
    ChatModule,
    MessageModule,
    FriendModule,
    LoggerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
