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
import { SendMessageDto } from './dto/send-message.dto';
import { MessageService } from './message.service';

@Controller('channel')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  /** P3.6: Gửi tin nhắn vào kênh (chỉ thành viên). */
  @Post(':channelId/messages')
  async sendMessage(
    @CurrentUser() user: RequestUser,
    @Param('channelId') channelId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messageService.createMessage(
      channelId,
      user.userId,
      dto.content,
    );
  }

  /** P3.7: Lấy tin nhắn trong kênh, phân trang (chỉ thành viên). */
  @Get(':channelId/messages')
  async getMessages(
    @CurrentUser() user: RequestUser,
    @Param('channelId') channelId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.messageService.getMessages(
      channelId,
      user.userId,
      pagination,
    );
  }
}
