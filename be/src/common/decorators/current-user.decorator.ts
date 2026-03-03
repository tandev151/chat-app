import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../interfaces/request-user.interface';

/**
 * Extracts the authenticated user from request.user (set by JwtStrategy after Bearer token validation).
 * Use on routes protected by AuthGuard('jwt') or JwtAuthGuard.
 *
 * @example
 * @UseGuards(AuthGuard('jwt'))
 * @Get('profile')
 * getProfile(@CurrentUser() user: RequestUser) {
 *   return user; // { userId, email }
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext): RequestUser | string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as RequestUser;

    if (data) {
      return user?.[data] ?? '';
    }
    return user;
  },
);
