"use client";

import { useEffect, useState, useCallback } from "react";
import { confirmFriend, getPendingRequests } from "@/lib/api/friend";
import type { PendingRequestItem } from "@/types/friend";
import { UserCard } from "@/components/user-card";

type ListState =
  | { status: "loading" }
  | { status: "success"; requests: PendingRequestItem[] }
  | { status: "error"; message: string };

export const FriendConfirmForm = ({
  onSuccess,
}: {
  onSuccess?: () => void;
} = {}) => {
  const [listState, setListState] = useState<ListState>({ status: "loading" });
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setListState({ status: "loading" });
    try {
      const requests = await getPendingRequests();
      setListState({ status: "success", requests });
    } catch {
      setListState({
        status: "error",
        message: "Could not load pending requests.",
      });
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleConfirm = async (
    friendRequestId: string,
    status: "accepted" | "rejected",
  ) => {
    setMessage(null);
    setActingRequestId(friendRequestId);
    try {
      await confirmFriend({ friendRequestId, status });
      setMessage({
        type: "success",
        text: status === "accepted" ? "Request accepted." : "Request rejected.",
      });
      onSuccess?.();
      fetchPending();
    } catch (err: unknown) {
      const res = err as { response?: { data?: { message?: string } } };
      setMessage({
        type: "error",
        text: res.response?.data?.message ?? "Failed to update request.",
      });
    } finally {
      setActingRequestId(null);
    }
  };

  const handleAccept = (friendRequestId: string) =>
    handleConfirm(friendRequestId, "accepted");
  const handleReject = (friendRequestId: string) =>
    handleConfirm(friendRequestId, "rejected");

  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50/50 p-2">
      <p className="mb-2 text-xs font-medium text-zinc-600">Pending requests</p>
      {message && (
        <p
          className={`mb-2 text-xs ${message.type === "success" ? "text-green-600" : "text-red-600"}`}
          role="alert"
        >
          {message.text}
        </p>
      )}
      {listState.status === "loading" && (
        <div className="py-3 text-center text-sm text-zinc-500">Loading…</div>
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
          aria-label="Pending friend requests"
        >
          <div className="space-y-2">
            {listState.requests.length === 0 ? (
              <div className="py-3 text-center text-sm text-zinc-500">
                No pending requests.
              </div>
            ) : (
              listState.requests.map((req) => (
                <UserCard
                  key={req.id}
                  id={req.id}
                  email={req.email}
                  displayName={req.displayName}
                  friendRequestId={req.id}
                  connectionStatus="pending"
                  onAccept={handleAccept}
                  onReject={handleReject}
                  actionLoading={actingRequestId === req.id}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
