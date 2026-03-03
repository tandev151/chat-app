import { QueryClient } from "@tanstack/react-query";

const defaultStaleTime = 60 * 1000; // 1 minute
const defaultCacheTime = 5 * 60 * 1000; // 5 minutes

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: defaultStaleTime,
      gcTime: defaultCacheTime,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
