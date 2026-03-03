import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  /**
   * P2.5: Gửi tin nhắn vào kênh. Chỉ thành viên kênh mới gửi được.
   */
  async createMessage(channelId: string, userId: string, content: string) {
    await this.ensureUserIsMember(channelId, userId);

    const message = await this.prisma.message.create({
      data: { channelId, userId, content },
      include: {
        user: { select: { id: true, displayName: true } },
      },
    });

    const payload = {
      id: message.id,
      content: message.content,
      userId: message.userId,
      channelId: message.channelId,
      createdAt: message.createdAt.toUTCString(),
      user: message.user,
    };
    this.chatGateway.broadcastNewMessage(channelId, payload);
    this.logger.debug(
      { channelId, messageId: message.id },
      'Message created and broadcast',
    );

    return payload;
  }

  /**
   * P2.6: Lấy tin nhắn trong kênh (phân trang, mới nhất trước). Chỉ thành viên mới xem được.
   */
  async getMessages(
    channelId: string,
    userId: string,
    pagination: PaginationQueryDto,
  ) {
    await this.ensureUserIsMember(channelId, userId);

    const limit = Math.min(pagination.limit ?? 20, 100);
    const page = Math.max(1, pagination.page ?? 1);
    const skip = (page - 1) * limit;

    const [messages, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where: { channelId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, displayName: true } },
        },
      }),

      this.prisma.message.count({
        where: {
          channelId,
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        userId: m.userId,
        createdAt: m.createdAt,
        user: m.user,
      })),
    };
  }

  private async ensureUserIsMember(
    channelId: string,
    userId: string,
  ): Promise<void> {
    const member = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (!member) {
      this.logger.warn({ channelId }, 'Channel access denied: not a member');
      throw new ForbiddenException('Bạn không phải thành viên kênh này');
    }
  }
}
