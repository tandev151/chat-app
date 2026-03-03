export type ChannelType = "DM" | "GROUP";

/** Payload for creating or getting a direct channel with a friend. */
export type CreateDirectChannelPayload = {
  friendId: string;
};

/** Single direct channel from POST /channel/direct or item in GET /channel/direct list. */
export type DirectChannelItem = {
  id: string;
  type: ChannelType;
  createdAt: string;
  friend: { id: string; displayName: string } | null;
};

/** Item in GET /channel/direct list (includes lastMessage and updatedAt). */
export type DirectChannelListItem = DirectChannelItem & {
  updatedAt: string;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
  } | null;
};

/** Response from GET /channel/:channelId (channel detail with members). */
export type ChannelDetail = {
  id: string;
  type: ChannelType;
  name: string | null;
  createdAt: string;
  updatedAt: string;
  members: { id: string; displayName: string }[];
};

/** Query params for paginated channel list. */
export type ChannelListQuery = {
  limit?: number;
  page?: number;
};
