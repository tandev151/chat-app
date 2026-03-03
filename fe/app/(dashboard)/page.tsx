export default function ChatPage() {
  return (
    <div className="flex h-full flex-col">
      <header
        className="flex shrink-0 items-center border-b border-zinc-200 bg-white px-4 py-3"
        aria-label="Channel header"
      >
        <h2 className="text-lg font-medium text-zinc-900">Select a channel</h2>
      </header>
      <div
        className="flex flex-1 flex-col items-center justify-center p-4"
        aria-label="Message list"
      >
        <p className="text-center text-sm text-zinc-500">
          Select a channel from the sidebar to start chatting.
        </p>
      </div>
    </div>
  );
}
