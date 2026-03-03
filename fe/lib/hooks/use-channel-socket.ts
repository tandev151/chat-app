"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { config } from "@/lib/config";
import type { MessageItem } from "@/types/message";

export type UseChannelSocketOptions = {
  channelId: string | null;
  accessToken: string | null;
  onMessage: (message: MessageItem) => void;
};

/**
 * Connects to Socket.IO with JWT, joins the channel room, and calls onMessage for each incoming "message" event.
 * Disconnects when channelId or token changes or on unmount.
 */
export function useChannelSocket({
  channelId,
  accessToken,
  onMessage,
}: UseChannelSocketOptions): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!channelId || !accessToken) {
      setConnected(false);
      return;
    }

    const socket = io(config.wsUrl, {
      path: "/socket.io",
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join", { channelId });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("message", (payload: MessageItem & { channelId?: string }) => {
      if (payload.channelId === channelId || !payload.channelId) {
        onMessageRef.current(payload);
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [channelId, accessToken]);

  return { connected };
}
