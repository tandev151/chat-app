"use client";

import { createContext, useCallback, useContext, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { setAuthCallbacks } from "@/lib/api/client";
import { login as apiLogin, refreshToken } from "@/lib/api/auth";
import { decodeJwtPayload } from "@/lib/jwt";
import { getAuthState, useAuthStore } from "@/lib/stores/auth-store";
import type { AuthResponse, LoginPayload } from "@/types/auth";

type AuthContextValue = {
  accessToken: string | null;
  userId: string | null;
  email: string | null;
  isReady: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Step-by-step access token storage:
 * 1. On login/refresh: API returns { accessToken, refreshToken }.
 * 2. Access token → stored in memory only (Zustand auth store). Never in localStorage.
 * 3. Refresh token → stored in localStorage via REFRESH_TOKEN_STORAGE_KEY (in auth-store).
 * 4. setAuthCallbacks registers getAccessToken that reads from auth store so axios attaches it to every request using AUTH_HEADER_KEY.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  const tryRefresh = useCallback(async (): Promise<string | null> => {
    const state = getAuthState();
    const stored = state.getStoredRefreshToken();
    if (!stored) {
      state.clearAuth();
      return null;
    }
    try {
      const res = await refreshToken({ refreshToken: stored });
      getAuthState().setTokens(res.accessToken, res.refreshToken);
      const payload = decodeJwtPayload(res.accessToken);
      getAuthState().setUserFromToken(
        payload?.userId ?? null,
        payload?.email ?? null
      );
      return res.accessToken;
    } catch {
      getAuthState().clearAuth();
      return null;
    }
  }, []);

  useEffect(() => {
    setAuthCallbacks({
      getAccessToken: () => getAuthState().accessToken,
      onUnauthorized: async () => {
        const newToken = await tryRefresh();
        if (!newToken) {
          router.replace("/login");
        }
        return newToken;
      },
    });
  }, [tryRefresh, router]);

  useEffect(() => {
    const stored = getAuthState().getStoredRefreshToken();
    if (stored) {
      tryRefresh().then((token) => {
        if (!token) {
          router.replace("/login");
        }
      });
    } else {
      getAuthState().clearAuth();
    }
  }, [tryRefresh, router]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const res = await apiLogin(payload);
      getAuthState().setTokens(res.accessToken, res.refreshToken);
      const payloadDecoded = decodeJwtPayload(res.accessToken);
      getAuthState().setUserFromToken(
        payloadDecoded?.userId ?? null,
        payloadDecoded?.email ?? null
      );
      router.replace("/");
    },
    [router]
  );

  const logout = useCallback(() => {
    getAuthState().clearAuth();
    router.replace("/login");
  }, [router]);

  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.userId);
  const email = useAuthStore((s) => s.email);
  const isReady = useAuthStore((s) => s.isReady);

  const value: AuthContextValue = {
    accessToken,
    userId,
    email,
    isReady,
    login,
    logout,
    isAuthenticated: !!accessToken,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
