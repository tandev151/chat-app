export type AddFriendPayload = {
  addresseeId: string;
};

export type ConfirmFriendPayload = {
  friendRequestId: string;
  status: "accepted" | "rejected";
};

export type FriendListItem = {
  id: string;
  email: string;
  displayName: string;
};

/** User row for "add friend" list (not connected yet). */
export type UserToAddItem = {
  id: string;
  email: string;
  displayName: string;
};

/** Pending friend request for "confirm" list. */
export type PendingRequestItem = {
  id: string;
  email: string;
  displayName: string;
};
