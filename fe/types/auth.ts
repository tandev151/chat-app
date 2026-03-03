export type AuthResponse = {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  type: "bearer";
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RefreshPayload = {
  refreshToken: string;
};
