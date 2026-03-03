import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmFriendDto {
  @ApiProperty({
    description: 'The ID of the friend request',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  friendRequestId: string;

  @ApiProperty({
    description: 'The status of the friend request',
    example: 'accepted | rejected',
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['accepted', 'rejected'])
  status: 'accepted' | 'rejected';
}
