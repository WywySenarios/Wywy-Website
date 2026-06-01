import type { EndpointFactory, OriginName } from "./types";
import { CSRF_ENDPOINTS } from "./endpoints";

const CACHE_URL = typeof process !== "undefined"
  ? process.env.CACHE_URL
  : import.meta.env.PUBLIC_CACHE_URL;

const DATABASE_URL = typeof process !== "undefined"
  ? process.env.DATABASE_URL
  : import.meta.env.PUBLIC_DATABASE_URL;

export const CACHE_CSRF_ENDPOINT = `${CACHE_URL}/cache/csrf`;

export async function getCSRFToken(origin: OriginName): Promise<string> {
  if (origin == "master-database")
    throw "The master database does not have CSRF tokens.";
  const endpoint = CSRF_ENDPOINTS[origin];

  const csrfResponse: Response = await fetch(endpoint, {
    mode: "cors",
    credentials: "include",
  });

  if (!csrfResponse.ok)
    throw new Error(`Failed to fetch CSRF token from ${endpoint}`);
  const csrfJSON: Object = await csrfResponse.json();
  if ("csrfToken" in csrfJSON) return String(csrfJSON["csrfToken"]);
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
