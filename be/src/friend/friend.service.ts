import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AddFriendDto } from './dto/add-friend.dto';
import { ConfirmFriendDto } from './dto/confirm-friend.dto';
import { FriendListItem } from './interface/friend-list.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class FriendService {
  constructor(private readonly prisma: PrismaService) {}

  async getFriends(userId: string): Promise<FriendListItem[]> {
    const acceptedRequests = await this.prisma.friendShipRequest.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requestUserId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: { id: true, email: true, displayName: true } },
        addressee: { select: { id: true, email: true, displayName: true } },
      },
    });

    return acceptedRequests.map((req) => {
      const friend =
        req.requestUserId === userId ? req.addressee : req.requester;
      return {
        id: friend.id,
        email: friend.email,
        displayName: friend.displayName,
      };
    });
  }

  async addFriend(requesterId: string, addFriendDto: AddFriendDto) {
    const { addresseeId } = addFriendDto;

    if (requesterId === addresseeId) {
      throw new BadRequestException('Cannot add yourself as a friend');
    }

    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
    });

    if (!requester) {
      throw new BadRequestException('Requester not found');
    }

    const addressee = await this.prisma.user.findUnique({
      where: { id: addresseeId },
    });

    if (!addressee) {
      throw new BadRequestException('Addressee not found');
    }

    const existingRequest = await this.prisma.friendShipRequest.findFirst({
      where: {
        requestUserId: requester.id,
        addresseeId: addressee.id,
      },
    });

    if (existingRequest) {
      throw new BadRequestException('Friend request already exists');
    }

    const newRequest = await this.prisma.friendShipRequest.create({
      data: {
        requestUserId: requester.id,
        addresseeId: addressee.id,
      },
    });

    return newRequest;
  }

  async confirmFriend(
    currentUserId: string,
    confirmFriendDto: ConfirmFriendDto,
  ) {
    const { friendRequestId, status } = confirmFriendDto;

    const requester = this.prisma.user.findUnique({
      where: { id: friendRequestId },
    });

    if (!requester) {
      throw new BadRequestException('Requester not found');
    }

    const request = await this.prisma.friendShipRequest.findFirst({
      where: {
        requestUserId: friendRequestId,
        addresseeId: currentUserId,
      },
    });

    if (!request) {
      throw new BadRequestException('Friend request not found');
    }

    let updatingResult: unknown;

    if (status === 'accepted') {
      updatingResult = await this.prisma.friendShipRequest.update({
        where: { id: request.id },
        data: { status: 'ACCEPTED' },
      });
    } else {
      updatingResult = await this.prisma.friendShipRequest.delete({
        where: { id: request.id },
      });
    }

    if (!updatingResult) {
      throw new BadRequestException('Failed to update friend request');
    }

    return updatingResult;
  }

  /**
   * Returns users that the current user can add as friend: not self, not already
   * friends, and not in a pending request (either direction).
   * Single DB query with relation filters; no loading all users into memory.
   */
  async getRecommendedFriends(
    currentUserId: string,
    paginationQueryDto: PaginationQueryDto,
  ): Promise<FriendListItem[]> {
    const { limit, page, orderBy } = paginationQueryDto;

    const users = await this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        NOT: {
          OR: [
            {
              friendshipRequestsSent: {
                some: {
                  addresseeId: currentUserId,
                  status: 'ACCEPTED',
                },
              },
            },
            {
              friendshipRequestsReceived: {
                some: {
                  requestUserId: currentUserId,
                  status: 'ACCEPTED',
                },
              },
            },
          ],
        },
        AND: [
          {
            NOT: {
              friendshipRequestsSent: {
                some: {
                  addresseeId: currentUserId,
                  status: 'PENDING',
                },
              },
            },
          },
          {
            NOT: {
              friendshipRequestsReceived: {
                some: {
                  requestUserId: currentUserId,
                  status: 'PENDING',
                },
              },
            },
          },
        ],
      },
      select: { id: true, email: true, displayName: true },
      orderBy: { displayName: 'asc' },
      take: 10,
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    }));
  }

  async getPendingRequests(currentUserId: string): Promise<FriendListItem[]> {
    const pendingRequests = await this.prisma.friendShipRequest.findMany({
      where: {
        addresseeId: currentUserId,
        status: 'PENDING',
      },
      include: {
        requester: { select: { id: true, email: true, displayName: true } },
      },
    });
    if (!pendingRequests) {
      return [];
    }

    return pendingRequests.map((req) => ({
      id: req.requester.id,
      email: req.requester.email,
      displayName: req.requester.displayName,
    }));
  }
}
