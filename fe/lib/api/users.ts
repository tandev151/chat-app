import { apiClient } from "@/lib/api/client";
import type { CreateUserPayload } from "@/types/user";

export const createUser = async (
  payload: CreateUserPayload
): Promise<boolean> => {
  const { data } = await apiClient.post<boolean>("/users", payload);
  return data;
};
