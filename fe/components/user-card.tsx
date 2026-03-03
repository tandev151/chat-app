"use client";

export type UserCardConnectionStatus = "none" | "pending" | "friend";

export type UserCardProps = {
  id: string;
  email: string;
  displayName: string;
  /** When "pending", pass friendRequestId for confirm/reject API. */
  friendRequestId?: string;
  connectionStatus: UserCardConnectionStatus;
  onAdd?: (userId: string) => void;
  onAccept?: (friendRequestId: string) => void;
  onReject?: (friendRequestId: string) => void;
  /** Single loading state for any action on this card. */
  actionLoading?: boolean;
  onGoToChat?: (friendId: string) => void;
};

export const UserCard = ({
  id,
  email,
  displayName,
  friendRequestId,
  connectionStatus,
  onAdd,
  onAccept,
  onReject,
  actionLoading = false,
  onGoToChat,
}: UserCardProps) => {
  const handleAdd = () => {
    if (!actionLoading && onAdd) onAdd(id);
  };
  const handleAccept = () => {
    if (!actionLoading && friendRequestId && onAccept)
      onAccept(friendRequestId);
  };
  const handleReject = () => {
    if (!actionLoading && friendRequestId && onReject)
      onReject(friendRequestId);
  };

  const handleGoToChat = () => {
    if (!actionLoading && onGoToChat) onGoToChat(id);
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-left shadow-sm transition-colors hover:bg-zinc-50/80">
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-zinc-900">
          {displayName}
        </span>
        <span className="block truncate text-xs text-zinc-500" title={email}>
          {email}
        </span>
      </div>
      {connectionStatus === "none" && onAdd && (
        <button
          type="button"
          onClick={handleAdd}
          disabled={actionLoading}
          className="self-start rounded bg-zinc-700 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          aria-label={`Add ${displayName} as friend`}
        >
          {actionLoading ? "Sending…" : "Add friend"}
        </button>
      )}
      {connectionStatus === "pending" && (onAccept || onReject) && (
        <div className="flex flex-wrap gap-2">
          {onAccept && (
            <button
              type="button"
              onClick={handleAccept}
              disabled={actionLoading}
              className="rounded bg-zinc-700 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              aria-label={`Accept request from ${displayName}`}
            >
              {actionLoading ? "…" : "Accept"}
            </button>
          )}
          {onReject && (
            <button
              type="button"
              onClick={handleReject}
              disabled={actionLoading}
              className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
              aria-label={`Reject request from ${displayName}`}
            >
              Reject
            </button>
          )}
        </div>
      )}

      {connectionStatus === "friend" && onGoToChat && (
        <button
          type="button"
          onClick={handleGoToChat}
          disabled={actionLoading}
          className="rounded bg-zinc-700 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          aria-label={`Go to chat with ${displayName}`}
        >
          Go to chat
        </button>
      )}
    </div>
  );
};
