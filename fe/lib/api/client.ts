import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { config } from "@/lib/config";
import { AUTH_HEADER_KEY, getAuthHeaderValue } from "@/lib/constants/auth";

export type AuthCallbacks = {
  getAccessToken: () => string | null;
  onUnauthorized: () => Promise<string | null>;
};

export type CreateApiClientOptions = {
  baseURL: string;
  /**
   * Auth for this client. If omitted, the client uses the global callbacks
   * set via setAuthCallbacks (for the main API). Pass null to disable auth.
   */
  auth?: AuthCallbacks | null;
  /** Default request headers. */
  headers?: Record<string, string>;
};

type RequestConfigWithRetry = InternalAxiosRequestConfig & { _retry?: boolean };

const REFRESH_TOKEN_PATH = "refresh-token";

const isRefreshRequest = (url: string | undefined): boolean =>
  !!url?.includes(REFRESH_TOKEN_PATH);

/** Attach access token to request using the single constant AUTH_HEADER_KEY. */
const attachAuth =
  (getToken: () => string | null) =>
  (reqConfig: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const accessToken = getToken();
    if (accessToken) {
      const headers = reqConfig.headers as Record<string, string>;
      headers[AUTH_HEADER_KEY] = getAuthHeaderValue(accessToken);
    }
    return reqConfig;
  };

const createUnauthorizedInterceptor =
  (instance: AxiosInstance, onUnauthorized: () => Promise<string | null>) =>
  async (err: {
    response?: { status: number };
    config?: RequestConfigWithRetry;
  }) => {
    const config = err.config;
    if (
      err.response?.status !== 401 ||
      !config ||
      config._retry ||
      isRefreshRequest(config.url)
    ) {
      return Promise.reject(err);
    }
    config._retry = true;
    const newToken = await onUnauthorized();
    if (newToken) {
      const headers = config.headers as Record<string, string>;
      headers[AUTH_HEADER_KEY] = getAuthHeaderValue(newToken);
      return instance(config);
    }
    return Promise.reject(err);
  };

let globalAuthCallbacks: AuthCallbacks | null = null;

/** Default API instance; auth interceptors are attached when setAuthCallbacks is called. */
const defaultApiInstance = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

let defaultAuthInterceptorsAttached = false;

export const setAuthCallbacks = (cbs: AuthCallbacks): void => {
  globalAuthCallbacks = cbs;
  if (!defaultAuthInterceptorsAttached) {
    defaultAuthInterceptorsAttached = true;
    defaultApiInstance.interceptors.request.use(attachAuth(cbs.getAccessToken));
    defaultApiInstance.interceptors.response.use(
      (res) => res,
      createUnauthorizedInterceptor(defaultApiInstance, cbs.onUnauthorized),
    );
  }
};

const getAuthForClient = (
  options: CreateApiClientOptions,
): AuthCallbacks | null => {
  if (options.auth === null) return null;
  return options.auth ?? globalAuthCallbacks;
};

/**
 * Factory: create an axios-backed API client for a given server.
 * Use one client per base URL; optionally attach auth (or use global).
 *
 * @example
 * // Main API (uses global auth from setAuthCallbacks)
 * const main = createApiClient({ baseURL: config.apiBaseUrl });
 *
 * @example
 * // Second server, same auth
 * const other = createApiClient({ baseURL: "https://other.example.com/api" });
 *
 * @example
 * // No auth (e.g. public API)
 * const publicApi = createApiClient({ baseURL: "...", auth: null });
 */
export const createApiClient = (
  options: CreateApiClientOptions | string,
): AxiosInstance => {
  const opts: CreateApiClientOptions =
    typeof options === "string" ? { baseURL: options } : options;

  const auth = getAuthForClient(opts);
  const instance = axios.create({
    baseURL: opts.baseURL,
    headers: {
      "Content-Type": "application/json",
      ...opts.headers,
    },
  });

  if (auth) {
    instance.interceptors.request.use(attachAuth(auth.getAccessToken));
    instance.interceptors.response.use(
      (res) => res,
      createUnauthorizedInterceptor(instance, auth.onUnauthorized),
    );
  }

  return instance;
};

/** Default client for the main API. Auth is attached when setAuthCallbacks is called (e.g. in AuthProvider). */
export const apiClient = defaultApiInstance;
