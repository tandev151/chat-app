import { apiClient } from "@/lib/api/client";
import type {
  ChannelDetail,
  ChannelListQuery,
  CreateDirectChannelPayload,
  DirectChannelItem,
  DirectChannelListItem,
} from "@/types/channel";

/** POST /channel/direct — Create or get direct channel with a friend. */
export const createOrGetDirectChannel = async (
  payload: CreateDirectChannelPayload
): Promise<DirectChannelItem> => {
  const { data } = await apiClient.post<DirectChannelItem>(
    "/channel/direct",
    payload
  );
  return data;
};

/** GET /channel/direct — List current user's direct channels (paginated). */
export const getDirectChannels = async (
  query?: ChannelListQuery
): Promise<DirectChannelListItem[]> => {
  const params = new URLSearchParams();
  if (query?.limit != null) params.set("limit", String(query.limit));
  if (query?.page != null) params.set("page", String(query.page));
  const search = params.toString() ? `?${params.toString()}` : "";
  const { data } = await apiClient.get<DirectChannelListItem[]>(
    `/channel/direct${search}`
  );
  return data;
};

/** GET /channel/:channelId — Get channel by ID (must be a member). */
export const getChannelById = async (
  channelId: string
): Promise<ChannelDetail> => {
  const { data } = await apiClient.get<ChannelDetail>(
    `/channel/${encodeURIComponent(channelId)}`
  );
  return data;
};
