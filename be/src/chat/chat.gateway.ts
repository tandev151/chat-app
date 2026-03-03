import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server } from 'socket.io';
import { ChannelService } from '../channel/channel.service';

const ROOM_PREFIX = 'channel:';

export type NewMessagePayload = {
  id: string;
  content: string;
  userId: string;
  channelId: string;
  createdAt: string;
  user: { id: string; displayName: string };
};

@WebSocketGateway({
  port: process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 3002,
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3001',
      'http://136.116.129.100',
    ],
  },
  path: '/socket.io',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly channelService: ChannelService,
  ) {}

  async handleConnection(client: any) {
    const token =
      client.handshake?.auth?.token ?? client.handshake?.query?.token;
    if (!token) {
      this.logger.warn('WS connection rejected: no token');
      client.disconnect();
      return;
    }
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET_KEY,
      });
      if (payload.type !== 'access' || !payload.userId) {
        client.disconnect();
        return;
      }
      client.data.userId = payload.userId;
    } catch {
      this.logger.warn('WS connection rejected: invalid token');
      client.disconnect();
    }
  }

  handleDisconnect() {
    this.logger.debug('Client disconnected');
  }

  @SubscribeMessage('join')
  async handleJoin(client: any, payload: { channelId: string }) {
    const userId = client.data?.userId;
    const channelId = payload?.channelId;
    if (!userId || !channelId) return;

    try {
      await this.channelService.ensureUserIsMember(channelId, userId);
      client.join(ROOM_PREFIX + channelId);
      this.logger.debug({ channelId, userId }, 'Client joined channel');
    } catch {
      this.logger.debug({ channelId, userId }, 'Join rejected: not a member');
    }
  }

  /** Called by MessageService after creating a message. Broadcasts to all clients in the channel room. */
  broadcastNewMessage(channelId: string, message: NewMessagePayload): void {
    this.server.to(ROOM_PREFIX + channelId).emit('message', message);
    this.logger.debug(
      { channelId, messageId: message.id },
      'Message broadcast to channel',
    );
  }
}
