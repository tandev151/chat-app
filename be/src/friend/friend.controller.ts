import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { AddFriendDto } from './dto/add-friend.dto';
import { FriendService } from './friend.service';
import { ConfirmFriendDto } from './dto/confirm-friend.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Controller('friend')
@UseGuards(JwtAuthGuard)
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get('friends')
  async getFriends(@CurrentUser() user: RequestUser) {
    return this.friendService.getFriends(user.userId);
  }

  @Post('add')
  async addFriend(
    @CurrentUser() user: RequestUser,
    @Body() addFriendDto: AddFriendDto,
  ) {
    return this.friendService.addFriend(user.userId, addFriendDto);
  }

  @Post('confirm')
  async confirmFriend(
    @CurrentUser() user: RequestUser,
    @Body() confirmFriendDto: ConfirmFriendDto,
  ) {
    return this.friendService.confirmFriend(user.userId, confirmFriendDto);
  }

  @Get('recommended')
  async getRecommendedFriends(
    @CurrentUser() user: RequestUser,
    @Query() paginationQueryDto: PaginationQueryDto,
  ) {
    return this.friendService.getRecommendedFriends(
      user.userId,
      paginationQueryDto,
    );
  }

  @Get('pending')
  async getPendingRequests(@CurrentUser() user: RequestUser) {
    return this.friendService.getPendingRequests(user.userId);
  }
}
