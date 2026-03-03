import { apiClient } from "@/lib/api/client";
import type {
  MessageItem,
  MessageList,
  MessageListQuery,
  SendMessagePayload,
  SendMessageResponse,
} from "@/types/message";

/** POST /channel/:channelId/messages — Send a message in the channel. */
export const sendMessage = async (
  channelId: string,
  payload: SendMessagePayload,
): Promise<SendMessageResponse> => {
  const { data } = await apiClient.post<SendMessageResponse>(
    `/channel/${encodeURIComponent(channelId)}/messages`,
    payload,
  );
  return data;
};

/** GET /channel/:channelId/messages — Get messages in the channel (paginated, newest first). */
export const getMessages = async (
  channelId: string,
  query?: MessageListQuery,
): Promise<MessageList> => {
  const params = new URLSearchParams();
  if (query?.limit != null) params.set("limit", String(query.limit));
  if (query?.page != null) params.set("page", String(query.page));
  const search = params.toString() ? `?${params.toString()}` : "";
  const { data } = await apiClient.get<MessageList>(
    `/channel/${encodeURIComponent(channelId)}/messages${search}`,
  );
  return data;
};
