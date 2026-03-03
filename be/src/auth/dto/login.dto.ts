import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: "User's email",
    example: 'user@example.com',
    format: 'email',
  })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: "User's password",
    example: 'Password@123',
    minLength: 8,
    maxLength: 32,
  })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
