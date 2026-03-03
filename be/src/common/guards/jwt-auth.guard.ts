import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that validates JWT Bearer token and attaches user to request.user.
 * Use with @CurrentUser() to get userId / email in controllers.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    
}
