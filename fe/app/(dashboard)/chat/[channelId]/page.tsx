"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getChannelById } from "@/lib/api/channel";
import { getMessages, sendMessage } from "@/lib/api/message";
import { useChannelSocket } from "@/lib/hooks/use-channel-socket";
import type { ChannelDetail } from "@/types/channel";
import type { MessageItem } from "@/types/message";

const THRESHOLD = 66;

export default function ChatChannelPage() {
  const params = useParams();
  const router = useRouter();
  const channelId =
    typeof params.channelId === "string" ? params.channelId : null;
  const { accessToken, userId } = useAuth();

  const [channel, setChannel] = useState<ChannelDetail | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const appendMessage = useCallback((msg: MessageItem) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [msg, ...prev];
    });
    scrollToFirstMessage({ behavior: "smooth" });
  }, []);

  const { connected } = useChannelSocket({
    channelId,
    accessToken,
    onMessage: appendMessage,
  });

  const scrollToFirstMessage = useCallback(
    (options: ScrollIntoViewOptions = {}) => {
      if (!listRef.current) return;
      const firstMessage = listRef.current.firstElementChild;
      if (!firstMessage) return;
      firstMessage.scrollIntoView(options);
    },
    [listRef.current, messages],
  );

  useEffect(() => {
    void scrollToFirstMessage({ behavior: "instant" });
  }, [messages]);

  useEffect(() => {
    if (!channelId || !accessToken) return;
    setLoading(true);
    setError(null);
    Promise.all([
      getChannelById(channelId),
      getMessages(channelId, { limit: 10, page: 1 }),
    ])
      .then(([ch, { messages, total, limit, page }]) => {
        setChannel(ch);
        setMessages(messages);
        setPage(page + 1);
        setHasNextPage(total > limit * page);
      })
      .catch(() => setError("Could not load channel or messages."))
      .finally(() => setLoading(false));
  }, [channelId, accessToken]);

  const handleLoadMore = useCallback(async () => {
    if (!channelId || !accessToken || !hasNextPage || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const { messages, total, limit } = await getMessages(channelId, {
        limit: 10,
        page: page,
      });
      setMessages((prev) => [...prev, ...messages]);
      setHasNextPage(total > limit * page);
      setPage((prev) => prev + 1);
    } catch (e) {
      setError("Could not load more messages.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [page]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || !channelId || sending) return;
    setSending(true);
    setInput("");
    try {
      const sent = await sendMessage(channelId, { content });
      appendMessage(sent);
    } catch {
      setInput(content);
    } finally {
      setSending(false);
    }
  }, [input, channelId, sending, appendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      if (
        target.scrollTop <= THRESHOLD &&
        !isFirstLoad.current &&
        hasNextPage &&
        !isLoadingMore
      ) {
        void handleLoadMore();
      }
    },
    [hasNextPage, isLoadingMore, handleLoadMore],
  );

  if (!channelId) {
    router.replace("/");
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <p className="text-sm text-zinc-500">Đang tải tin nhắn...</p>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <p className="text-sm text-red-600">{error ?? "Channel not found."}</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-2 text-sm text-zinc-600 underline hover:text-zinc-900"
        >
          Quay về trang chủ
        </button>
      </div>
    );
  }

  const channelDisplayName =
    channel.type === "DM" && channel.members.length === 2 && userId
      ? (channel.members.find((m) => m.id !== userId)?.displayName ?? "Chat")
      : (channel.name ?? "Chat");

  return (
    <div className="flex h-full flex-col">
      <header
        className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 py-3"
        aria-label="Channel header"
      >
        <h2 className="text-lg font-medium text-zinc-900">
          {channelDisplayName}
        </h2>
        {connected ? (
          <span className="text-xs text-emerald-600" aria-label="Connected">
            Đang hoạt động
          </span>
        ) : (
          <span className="text-xs text-zinc-400">Đang kết nối…</span>
        )}
      </header>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4"
        aria-label="Message list"
        role="log"
        onScroll={handleScroll}
      >
        <div className="flex flex-col-reverse gap-3" ref={listRef}>
          {messages.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">
              No messages yet. Say hello!
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.userId === userId
                    ? "ml-auto max-w-[80%] rounded-lg bg-zinc-800 px-3 py-2 text-right text-sm text-white"
                    : "max-w-[80%] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
                }
              >
                {m.userId !== userId && (
                  <span className="block text-xs font-medium text-zinc-500">
                    {m.user.displayName}
                  </span>
                )}
                <p className="word-break-all">{m.content}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(m.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
            ))
          )}

          {isLoadingMore && (
            <p className="py-4 text-center text-sm text-zinc-500">
              Đang tải thêm tin nhắn...
            </p>
          )}
        </div>
      </div>

      <div
        className="shrink-0 border-t border-zinc-200 bg-white p-4"
        aria-label="Message input"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn…"
            disabled={sending}
            className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-50"
            aria-label="Message input"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
            aria-label="Send message"
          >
            {sending ? "Đang gửi…" : "Gửi"}
          </button>
        </div>
      </div>
    </div>
  );
}
