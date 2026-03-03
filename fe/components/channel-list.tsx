"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { getDirectChannels } from "@/lib/api/channel";
import type { DirectChannelListItem } from "@/types/channel";
import { ChannelCard } from "@/components/channel-card";

type ChannelListState =
  | { status: "loading" }
  | { status: "success"; channels: DirectChannelListItem[] }
  | { status: "error"; message: string };

export const ChannelList = () => {
  const [state, setState] = useState<ChannelListState>({ status: "loading" });

  const fetchChannels = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const channels = await getDirectChannels({ limit: 50, page: 1 });
      setState({ status: "success", channels });
    } catch {
      setState({
        status: "error",
        message: "Could not load channels.",
      });
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  if (state.status === "loading") {
    return (
      <div
        className="py-4 text-center text-sm text-zinc-500"
        aria-label="Loading channels"
      >
        Loading…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        className="py-2 text-center text-sm text-red-600"
        role="alert"
        aria-label="Channel list error"
      >
        {state.message}
      </div>
    );
  }

  if (state.channels.length === 0) {
    return (
      <div
        className="py-4 text-center text-sm text-zinc-500"
        aria-label="No channels yet"
      >
        No direct channels yet.
      </div>
    );
  }

  return (
    <div
      className="max-h-48 overflow-y-auto rounded-md border border-zinc-200 bg-zinc-50/50 p-2"
      role="list"
      aria-label="Direct channels"
    >
      <ul className="space-y-2">
        {state.channels.map((channel) => (
          <li key={channel.id}>
            <Link
              href={`/chat/${channel.id}`}
              className="block focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 rounded-md"
              aria-label={`Open chat with ${channel.friend?.displayName ?? "Unknown"}`}
            >
              <ChannelCard channel={channel} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
