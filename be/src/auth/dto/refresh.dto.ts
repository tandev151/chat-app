import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty({ message: 'Refresh token is required' })
  @IsJWT({ message: 'Invalid refresh token' })
  @ApiProperty({
    description: 'Refresh token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNjU5MDIwMDAwLCJleHAiOjE2NTkwMjE1MDAsInR5cCI6ImFjY2VzcyJ9.wZUJq_H2QqQlF2xL1C97KZ-Gg2H5pz8TgNhD_mP1cQ',
  })
  refreshToken: string;
}
