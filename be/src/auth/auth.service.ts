import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from 'prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AuthResponse } from './interface/auth.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(createAuthDto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: createAuthDto.email,
      },
    });

    if (!user) {
      throw new NotFoundException('Email or password is incorrect');
    }

    const isPasswordValid = await bcrypt.compare(
      createAuthDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    return {
      accessToken: this.jwtService.sign(
        {
          userId: user.id,
          email: user.email,
          type: 'access',
        },
        { expiresIn: 15 * 60 },
      ),
      expiresIn: 15 * 60, //15 minutes
      refreshToken: this.jwtService.sign(
        {
          userId: user.id,
          type: 'refresh',
        },
        { expiresIn: 60 * 60 }, //1 hour
      ),
      type: 'bearer',
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const decoded = this.jwtService.verify(refreshToken);

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return {
        accessToken: this.jwtService.sign(
          {
            userId: user.id,
            email: user.email,
            type: 'access',
          },
          { expiresIn: 15 * 60 }, //15 minutes
        ),
        expiresIn: 15 * 60, //15 minutes
        refreshToken: this.jwtService.sign(
          {
            userId: user.id,
            type: 'refresh',
          },
          { expiresIn: 60 * 60 },
        ),
        type: 'bearer',
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
