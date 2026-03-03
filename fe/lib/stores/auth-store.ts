"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { REFRESH_TOKEN_STORAGE_KEY } from "@/lib/constants/auth";

export type AuthStore = {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  email: string | null;
  isReady: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUserFromToken: (userId: string | null, email: string | null) => void;
  clearAuth: () => void;
  getStoredRefreshToken: () => string | null;
};

const persistRefreshToken = (refreshToken: string): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
};

const removeStoredRefreshToken = (): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
};

const readStoredRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
};

const initialState = {
  accessToken: null as string | null,
  refreshToken: null as string | null,
  userId: null as string | null,
  email: null as string | null,
  isReady: false,
};

// Step 1: Create store with devtools middleware (wraps the initializer)
const useAuthStoreBase = create<AuthStore>()(
  devtools(
    (set) => ({
      ...initialState,

      setTokens: (accessToken, refreshToken) => {
        persistRefreshToken(refreshToken);
        // Step 2: Pass action name as 3rd arg so DevTools shows it
        set(
          { accessToken, refreshToken, isReady: true },
          undefined,
          "auth/setTokens"
        );
      },

      setUserFromToken: (userId, email) => {
        set({ userId, email }, undefined, "auth/setUserFromToken");
      },

      clearAuth: () => {
        removeStoredRefreshToken();
        set(
          {
            accessToken: null,
            refreshToken: null,
            userId: null,
            email: null,
            isReady: true,
          },
          undefined,
          "auth/clearAuth"
        );
      },

      getStoredRefreshToken: readStoredRefreshToken,
    }),
    // Step 3: DevTools options (name shows in Redux DevTools panel)
    { name: "AuthStore" }
  )
);

// Step 4: Expose vanilla store for getState() outside React
export const authStore = useAuthStoreBase;

// Step 5: Hook with shallow compare (same API as before)
export const useAuthStore = <T>(selector: (state: AuthStore) => T): T =>
  useStore(useAuthStoreBase, useShallow(selector as (state: unknown) => T));

/** Typed getter for use outside React (e.g. in API callbacks). */
export const getAuthState = (): AuthStore =>
  useAuthStoreBase.getState() as AuthStore;
