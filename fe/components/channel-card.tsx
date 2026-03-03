"use client";

import type { DirectChannelListItem } from "@/types/channel";

export type ChannelCardProps = {
  channel: DirectChannelListItem;
};

/** Display name for a direct channel (the other user). */
function channelDisplayName(channel: DirectChannelListItem): string {
  return channel.friend?.displayName ?? "Unknown";
}

/** Preview of last message, truncated. */
function lastMessagePreview(channel: DirectChannelListItem): string | null {
  const msg = channel.lastMessage?.content;
  if (!msg) return null;
  return msg.length > 60 ? `${msg.slice(0, 60)}…` : msg;
}

export const ChannelCard = ({ channel }: ChannelCardProps) => {
  const name = channelDisplayName(channel);
  const preview = lastMessagePreview(channel);

  return (
    <div
      className="flex flex-col gap-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-left shadow-sm transition-colors hover:bg-zinc-50/80"
      role="article"
      aria-label={`Channel with ${name}`}
    >
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-zinc-900">
          {name}
        </span>
        {preview ? (
          <span className="block truncate text-xs text-zinc-500" title={preview}>
            {preview}
          </span>
        ) : (
          <span className="block text-xs text-zinc-400">No messages yet</span>
        )}
      </div>
    </div>
  );
};
