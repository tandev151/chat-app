const API_BASE_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api")
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api");

/** WebSocket (Socket.IO) server URL — runs on a separate port (WS_PORT, default 3002). Set NEXT_PUBLIC_WS_URL to match (e.g. http://host:3002). */
const WS_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3000")
    : (process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3000");
console.log("WS_URL", WS_URL);
console.log("API_BASE_URL", API_BASE_URL);
export const config = {
  apiBaseUrl: API_BASE_URL,
  wsUrl: WS_URL,
} as const;
