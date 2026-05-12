import type { EndpointFactory, OriginName } from "@/types/http";
import { CSRF_ENDPOINTS } from "./endpoints";
import { getCSRFToken } from "./auth";

/**
 * Generic POST function that embeds a CSRF token if needed.
 * @param origin The origin to POST to.
 * @param endpointFactory
 * @param fetchOptions This includes additional HTTP headers to pass in.
 * @returns The response to HTTP request.
 */
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
