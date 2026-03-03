export type JwtPayload = {
  userId?: string;
  email?: string;
  type?: string;
  exp?: number;
};

export const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    ) as JwtPayload;
    return payload;
  } catch {
    return null;
  }
};
