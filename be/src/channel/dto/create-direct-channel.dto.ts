import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateDirectChannelDto {
  @ApiProperty({
    description: 'ID của bạn bè để tạo hoặc mở kênh chat 1-1',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  friendId: string;
}
