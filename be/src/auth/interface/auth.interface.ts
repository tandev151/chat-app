export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  type: 'bearer';
}

/** Payload trong accessToken (AuthService.sign) */
export interface JwtPayload {
  userId: string;
  email?: string;
  type: 'access' | 'refresh';
}

/** Đối tượng gắn vào request.user sau khi JwtStrategy validate */
export interface JwtUser {
  userId: string;
  email: string;
}
