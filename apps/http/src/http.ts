import type { EndpointFactory, OriginName } from "./types";
import { CSRF_ENDPOINTS } from "./endpoints";

const CACHE_URL = typeof process !== "undefined"
  ? process.env.CACHE_URL
  : import.meta.env.PUBLIC_CACHE_URL;

const DATABASE_URL = typeof process !== "undefined"
  ? process.env.DATABASE_URL
  : import.meta.env.PUBLIC_DATABASE_URL;

export const CACHE_CSRF_ENDPOINT = `${CACHE_URL}/cache/csrf`;

let csrfTokenCache: string | undefined;

export async function getCSRFToken(origin: OriginName): Promise<string> {
  if (origin == "master-database")
    throw "The master database does not have CSRF tokens.";
  if (csrfTokenCache) return csrfTokenCache;
  const endpoint = CSRF_ENDPOINTS[origin];

  const csrfResponse: Response = await fetch(endpoint, {
    mode: "cors",
    credentials: "include",
  });

  if (!csrfResponse.ok)
    throw new Error(`Failed to fetch CSRF token from ${endpoint}`);
  const csrfJSON: Object = await csrfResponse.json();
  if ("csrfToken" in csrfJSON) {
    const token = String(csrfJSON["csrfToken"]);
    csrfTokenCache = token;
    if (typeof document !== "undefined" && CACHE_URL) {
      const cacheUrl = new URL(CACHE_URL);
      const pageOrigin = typeof location !== "undefined"
        ? `${location.protocol}//${location.hostname}`
        : "";
      const cacheOrigin = `${cacheUrl.protocol}//${cacheUrl.hostname}`;
      const sameOrigin = pageOrigin === cacheOrigin;
      const secure = CACHE_URL.startsWith("https:") ? "; Secure" : "";
      const sameSite = sameOrigin ? "" : `; SameSite=None${secure}`;
      const expires = new Date(Date.now() + 365 * 86400 * 1000).toUTCString();
      document.cookie = `csrftoken=${token}; path=/; expires=${expires}${sameSite}`;

      const w = window as unknown as Record<string, unknown>;
      if (w.webkit?.messageHandlers?.cookieHandler) {
        (w.webkit as Record<string, { postMessage: (msg: unknown) => void }>)
          .messageHandlers.cookieHandler.postMessage({
            name: "csrftoken",
            value: token,
            url: CACHE_URL,
            path: "/",
            secure: cacheUrl.protocol === "https:",
            expires: Date.now() / 1000 + 365 * 86400,
          });
      }
    }
    return token;
  }
  throw new Error(`Unexpected response to CSRF token request to ${endpoint}`);
}

export async function post(
  origin: OriginName,
  endpointFactory: EndpointFactory,
  fetchOptions: RequestInit = {},
): Promise<Response> {
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (CSRF_ENDPOINTS[origin]) {
    headers["X-CSRFToken"] = await getCSRFToken(origin);
  }

  return await fetch(endpointFactory(origin), {
    mode: "cors",
    credentials: "include",
    ...fetchOptions,
    method: "POST",
    headers: headers,
  });
}
