import { CACHE_URL } from "astro:env/client";

export const CACHE_CSRF_ENDPOINT = `${CACHE_URL}/cache/csrf`;

/**
 * Asynchronous CSRF token fetching.
 * @param endpoint The endpoint to fetch.
 * @returns A promise to a CSRF token.
 */
export async function getCSRFToken(endpoint: string): Promise<string> {
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
