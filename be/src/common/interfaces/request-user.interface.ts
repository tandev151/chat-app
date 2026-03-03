/**
 * User info attached to request after JWT validation (JwtStrategy).
 * Use with @CurrentUser() decorator in controllers.
 */
export interface RequestUser {
  userId: string;
  email: string;
}
