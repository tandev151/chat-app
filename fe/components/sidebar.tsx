"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { ChannelList } from "@/components/channel-list";
import { FriendSection } from "@/components/friend-section";

export const Sidebar = () => {
  const { email, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleKeyDownLogout = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleLogout();
    }
  };

  return (
    <aside
      className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white"
      aria-label="Sidebar"
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <Link
          href="/"
          className="font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
          aria-label="Chat home"
        >
          Chat
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <section
          className="mb-4"
          aria-label="Channels"
        >
          <h3 className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Channels
          </h3>
          <ChannelList />
        </section>
        <FriendSection />
      </div>
      <div className="border-t border-zinc-200 p-2">
        <p className="truncate px-2 py-1 text-sm text-zinc-600" title={email ?? undefined}>
          {email ?? "—"}
        </p>
        <button
          type="button"
          onClick={handleLogout}
          onKeyDown={handleKeyDownLogout}
          className="w-full rounded-md px-2 py-1.5 text-left text-sm text-zinc-600 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
          aria-label="Log out"
          tabIndex={0}
        >
          Log out
        </button>
      </div>
    </aside>
  );
};
