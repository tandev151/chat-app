import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload, JwtUser } from '../interface/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // lấy token từ header Authorization
      ignoreExpiration: false, // false: không accept token hết hạn
      secretOrKey: process.env.JWT_SECRET_KEY, // secret key để verify token
    });
  }

  /**
   * Passport gọi validate() sau khi verify chữ ký và decode payload.
   * Giá trị return được gắn vào request.user (dùng với @CurrentUser() sau này).
   * Chỉ chấp nhận access token; reject nếu là refresh token.
   */
  validate(payload: JwtPayload): JwtUser {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }
    if (!payload.userId) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      userId: payload.userId,
      email: payload.email ?? '',
    };
  }
}
