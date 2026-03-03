import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateDirectChannelDto } from './dto/create-direct-channel.dto';
import { ChannelService } from './channel.service';

@Controller('channel')
@UseGuards(JwtAuthGuard)
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  /** P3.3: Tạo hoặc lấy kênh DM với một bạn. */
  @Post('direct')
  async createOrGetDirect(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateDirectChannelDto,
  ) {
    return this.channelService.getOrCreateDirectChannel(user.userId, dto.friendId);
  }

  /** P3.4: Danh sách kênh DM của user (phân trang). */
  @Get('direct')
  async getDirectChannels(
    @CurrentUser() user: RequestUser,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.channelService.getDirectChannels(user.userId, pagination);
  }

  /** P3.5: Chi tiết một kênh (chỉ thành viên). */
  @Get(':channelId')
  async getChannel(
    @CurrentUser() user: RequestUser,
    @Param('channelId') channelId: string,
  ) {
    return this.channelService.getChannelById(channelId, user.userId);
  }
}
