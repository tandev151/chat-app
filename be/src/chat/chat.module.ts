import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChannelModule } from '../channel/channel.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '1h' },
    }),
    ChannelModule,
  ],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
