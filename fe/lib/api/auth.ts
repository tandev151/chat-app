import { apiClient } from "@/lib/api/client";
import type { AuthResponse, LoginPayload, RefreshPayload } from "@/types/auth";

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
  return data;
};

export const refreshToken = async (
  payload: RefreshPayload
): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>(
    "/auth/refresh-token",
    payload
  );
  return data;
};
