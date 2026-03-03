"use client";

import { useRef, useCallback } from "react";
import { FriendList } from "@/components/friend-list";
import { FriendAddForm } from "@/components/friend-add-form";
import { FriendConfirmForm } from "@/components/friend-confirm-form";

export const FriendSection = () => {
  const refetchFriendsRef = useRef<(() => void) | null>(null);

  const handleFriendChange = useCallback(() => {
    refetchFriendsRef.current?.();
  }, []);

  return (
    <section aria-label="Friends">
      <h3 className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Friends
      </h3>
      <div className="mt-2 space-y-3">
        <div className="min-h-0 shrink-0">
          <FriendList refetchRef={refetchFriendsRef} />
        </div>
        <FriendAddForm onSuccess={handleFriendChange} />
        <FriendConfirmForm onSuccess={handleFriendChange} />
      </div>
    </section>
  );
};
