/** Payload for sending a message. */
export type SendMessagePayload = {
  content: string;
};

/** Message as returned by API (single message or list item). */
export type MessageItem = {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
  user: { id: string; displayName: string };
};

/** Message list as returned by API (paginated). */
export type MessageList = {
  total: number;
  page: number;
  limit: number;
  messages: MessageItem[];
};

/** Message from POST /channel/:channelId/messages (includes channelId). */
export type SendMessageResponse = MessageItem & {
  channelId: string;
};

/** Query params for paginated messages. */
export type MessageListQuery = {
  limit?: number;
  page?: number;
};
