import { apiClient } from "@/lib/api/client";
import type {
  AddFriendPayload,
  ConfirmFriendPayload,
  FriendListItem,
  PendingRequestItem,
  UserToAddItem,
} from "@/types/friend";

export const getFriends = async (): Promise<FriendListItem[]> => {
  const { data } = await apiClient.get<FriendListItem[]>("/friend/friends");
  return data;
};

export const addFriend = async (payload: AddFriendPayload) => {
  const { data } = await apiClient.post("/friend/add", payload);
  return data;
};

export const confirmFriend = async (payload: ConfirmFriendPayload) => {
  const { data } = await apiClient.post("/friend/confirm", payload);
  return data;
};

export const getRecommendedFriends = async (): Promise<FriendListItem[]> => {
  const { data } = await apiClient.get<FriendListItem[]>("/friend/recommended");
  return data;
};

/** Pending incoming friend requests. Replace with real API (e.g. GET /friend/pending-requests). */
export const getPendingRequests = async (): Promise<PendingRequestItem[]> => {
  const { data } = await apiClient.get<PendingRequestItem[]>("/friend/pending");
  return data;
};
