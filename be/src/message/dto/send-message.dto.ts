import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

const MAX_MESSAGE_LENGTH = 4096;

export class SendMessageDto {
  @ApiProperty({
    description: 'Nội dung tin nhắn',
    example: 'Hello!',
    maxLength: MAX_MESSAGE_LENGTH,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1, { message: 'Nội dung tin nhắn không được để trống' })
  @MaxLength(MAX_MESSAGE_LENGTH, {
    message: `Tin nhắn tối đa ${MAX_MESSAGE_LENGTH} ký tự`,
  })
  content: string;
}
