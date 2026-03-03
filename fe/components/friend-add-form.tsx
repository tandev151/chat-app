"use client";

import { useEffect, useState, useCallback } from "react";
import { addFriend, getRecommendedFriends } from "@/lib/api/friend";
import type { UserToAddItem } from "@/types/friend";
import { UserCard } from "@/components/user-card";

type ListState =
  | { status: "loading" }
  | { status: "success"; users: UserToAddItem[] }
  | { status: "error"; message: string };

export const FriendAddForm = ({
  onSuccess,
}: {
  onSuccess?: () => void;
} = {}) => {
  const [listState, setListState] = useState<ListState>({ status: "loading" });
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setListState({ status: "loading" });
    try {
      const users = await getRecommendedFriends();
      setListState({ status: "success", users });
    } catch {
      setListState({ status: "error", message: "Could not load users." });
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAdd = async (userId: string) => {
    setMessage(null);
    setAddingId(userId);
    try {
      await addFriend({ addresseeId: userId });
      setMessage({ type: "success", text: "Friend request sent." });
      onSuccess?.();
      fetchUsers();
    } catch (err: unknown) {
      const res = err as { response?: { data?: { message?: string } } };
      setMessage({
        type: "error",
        text: res.response?.data?.message ?? "Failed to send request.",
      });
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50/50 p-2">
      <p className="mb-2 text-xs font-medium text-zinc-600">Add friend</p>
      {message && (
        <p
          className={`mb-2 text-xs ${message.type === "success" ? "text-green-600" : "text-red-600"}`}
          role="alert"
        >
          {message.text}
        </p>
      )}
      {listState.status === "loading" && (
        <div className="py-3 text-center text-sm text-zinc-500">
          Loading users…
        </div>
      )}
      {listState.status === "error" && (
        <div className="py-2 text-sm text-red-600" role="alert">
          {listState.message}
        </div>
      )}
      {listState.status === "success" && (
        <div
          className="max-h-40 overflow-y-auto"
          role="list"
          aria-label="Users you can add"
        >
          <div className="space-y-2">
            {listState.users.length === 0 ? (
              <div
                key="no-users"
                className="py-3 text-center text-sm text-zinc-500"
              >
                No users to add right now.
              </div>
            ) : (
              listState.users.map((user) => (
                <UserCard
                  key={user.id}
                  id={user.id}
                  email={user.email}
                  displayName={user.displayName}
                  connectionStatus="none"
                  onAdd={handleAdd}
                  actionLoading={addingId === user.id}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
