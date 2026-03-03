import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ChannelType } from 'generated/prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class ChannelService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * P2.1: Kiểm tra hai user đã là bạn (FriendShipRequest ACCEPTED).
   */
  private async areFriends(userId: string, friendId: string): Promise<boolean> {
    if (userId === friendId) return false;
    const request = await this.prisma.friendShipRequest.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requestUserId: userId, addresseeId: friendId },
          { requestUserId: friendId, addresseeId: userId },
        ],
      },
    });
    return !!request;
  }

  /**
   * P2.2: Tạo hoặc lấy kênh DM giữa userId và friendId (chỉ khi đã là bạn).
   */
  async getOrCreateDirectChannel(userId: string, friendId: string) {
    const friends = await this.areFriends(userId, friendId);
    if (!friends) {
      throw new ForbiddenException(
        'Chỉ có thể tạo kênh chat với bạn bè. Hai user chưa là bạn.',
      );
    }

    const existing = await this.prisma.channel.findFirst({
      where: {
        type: ChannelType.DM,
        channelMembers: {
          every: { userId: { in: [userId, friendId] } },
        },
      },
      include: {
        channelMembers: {
          include: { user: { select: { id: true, displayName: true } } },
        },
      },
    });

    if (existing && existing.channelMembers.length === 2) {
      return this.toDirectChannelResponse(existing, userId);
    }

    const channel = await this.prisma.channel.create({
      data: {
        type: ChannelType.DM,
        name: null,
        createdById: userId,
        channelMembers: {
          create: [{ userId }, { userId: friendId }],
        },
      },
      include: {
        channelMembers: {
          include: { user: { select: { id: true, displayName: true } } },
        },
      },
    });

    return this.toDirectChannelResponse(channel, userId);
  }

  private toDirectChannelResponse(channel: any, currentUserId: string) {
    const other = channel.channelMembers.find(
      (m: any) => m.userId !== currentUserId,
    );
    return {
      id: channel.id,
      type: channel.type,
      createdAt: channel.createdAt,
      friend: other?.user
        ? { id: other.user.id, displayName: other.user.displayName }
        : null,
    };
  }

  /**
   * P2.3: Danh sách kênh DM của user (có phân trang, kèm thông tin bạn và lastMessage).
   */
  async getDirectChannels(userId: string, pagination: PaginationQueryDto) {
    const limit = Math.min(pagination.limit ?? 20, 100);
    const page = Math.max(1, pagination.page ?? 1);
    const skip = (page - 1) * limit;

    const channels = await this.prisma.channel.findMany({
      where: {
        type: ChannelType.DM,
        channelMembers: { some: { userId } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      include: {
        channelMembers: {
          include: { user: { select: { id: true, displayName: true } } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, content: true, createdAt: true },
        },
      },
    });

    return channels.map((ch) => {
      const other = ch.channelMembers.find((m) => m.userId !== userId)?.user;
      const lastMessage = ch.messages[0] ?? null;
      return {
        id: ch.id,
        type: ch.type,
        createdAt: ch.createdAt,
        updatedAt: ch.updatedAt,
        friend: other
          ? { id: other.id, displayName: other.displayName }
          : null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
            }
          : null,
      };
    });
  }

  /**
   * P2.4: Chi tiết một kênh; nếu user không phải member thì throw Forbidden.
   */
  async getChannelById(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        channelMembers: {
          include: { user: { select: { id: true, displayName: true } } },
        },
      },
    });

    if (!channel) {
      throw new BadRequestException('Kênh không tồn tại');
    }

    const isMember = channel.channelMembers.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('Bạn không phải thành viên kênh này');
    }

    return {
      id: channel.id,
      type: channel.type,
      name: channel.name,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
      members: channel.channelMembers.map((m) => ({
        id: m.user.id,
        displayName: m.user.displayName,
      })),
    };
  }

  /**
   * Kiểm tra user có phải member của channel không (dùng trong MessageService hoặc guard).
   */
  async ensureUserIsMember(channelId: string, userId: string): Promise<void> {
    const member = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (!member) {
      throw new ForbiddenException('Bạn không phải thành viên kênh này');
    }
  }
}
