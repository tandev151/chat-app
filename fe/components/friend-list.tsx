"use client";

import { useEffect, useState, useCallback } from "react";
import { getFriends } from "@/lib/api/friend";
import type { FriendListItem } from "@/types/friend";
import { UserCard } from "@/components/user-card";
import { useRouter } from "next/navigation";
import { createOrGetDirectChannel } from "@/lib/api/channel";

type FriendListState =
  | { status: "loading" }
  | { status: "success"; friends: FriendListItem[] }
  | { status: "error"; message: string };

export const FriendList = ({
  refetchRef,
}: {
  /** Optional ref to receive refetch function (e.g. call after add/confirm). */
  refetchRef?: React.MutableRefObject<(() => void) | null>;
} = {}) => {
  const [state, setState] = useState<FriendListState>({ status: "loading" });
  const router = useRouter();
  const fetchFriends = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const friends = await getFriends();
      setState({ status: "success", friends });
    } catch {
      setState({
        status: "error",
        message: "Could not load friends.",
      });
    }
  }, []);

  const handleGoToChat = useCallback(async (friendId: string) => {
    try {
      const res = await createOrGetDirectChannel({
        friendId,
      });

      if (res.id) {
        router.push(`/chat/${res.id}`);
      }
      console.log(res);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  useEffect(() => {
    if (refetchRef) {
      refetchRef.current = fetchFriends;
      return () => {
        refetchRef.current = null;
      };
    }
  }, [refetchRef, fetchFriends]);

  return <FriendListView state={state} onGoToChat={handleGoToChat} />;
};

type FriendListViewProps = {
  state: FriendListState;
  onGoToChat: (friendId: string) => void;
};

const FriendListView = ({ state, onGoToChat }: FriendListViewProps) => {
  if (state.status === "loading") {
    return (
      <div
        className="py-4 text-center text-sm text-zinc-500"
        aria-label="Loading friends"
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
        aria-label="Friend list error"
      >
        {state.message}
      </div>
    );
  }

  if (state.friends.length === 0) {
    return (
      <div
        className="py-4 text-center text-sm text-zinc-500"
        aria-label="No friends yet"
      >
        No friends yet. Send a request above.
      </div>
    );
  }

  return (
    <div
      className="max-h-48 overflow-y-auto rounded-md border border-zinc-200 bg-zinc-50/50 p-2"
      role="list"
      aria-label="Friend list"
    >
      <ul className="space-y-2">
        {state.friends.map((friend) => (
          <UserCard
            key={friend.id}
            id={friend.id}
            email={friend.email}
            displayName={friend.displayName}
            connectionStatus="friend"
            onGoToChat={onGoToChat}
          />
        ))}
      </ul>
    </div>
  );
};
