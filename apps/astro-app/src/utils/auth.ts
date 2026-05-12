import type { OriginName } from "@/types/http";
import { CACHE_URL } from "astro:env/client";
import {
  CSRF_ENDPOINTS,
  LOGIN_ENDPOINT_FACTORY,
  LOGOUT_ENDPOINT_FACTORY,
  ORIGIN_NAMES,
  WHOAMI_ENDPOINT_FACTORY,
} from "./endpoints";
import { post } from "./http";

export const CACHE_CSRF_ENDPOINT = `${CACHE_URL}/cache/csrf`;

/**
 * Asynchronous CSRF token fetching.
 * @param endpoint The endpoint to fetch.
 * @returns A promise to a CSRF token.
 */
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

class AuthenticationError extends Error {
  status: number;
  message: string;

  constructor(status: number, statusText: string, body: string) {
    super(`${status} ${statusText} ${body}`);
    this.name = "AuthenticationError";
    this.status = status;
    this.message = body;
  }
}

export async function login(
  origin: OriginName,
  username: string,
  password: string,
) {
  const response = await post(origin, LOGIN_ENDPOINT_FACTORY, {
    body: JSON.stringify({ username: username, password: password }),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  });

  if (response.status !== 200)
    throw new AuthenticationError(
      response.status,
      response.statusText,
      await response.text(),
    );
}

export async function logout(origin: OriginName) {
  const response = await post(origin, LOGOUT_ENDPOINT_FACTORY);

  if (response.status !== 200)
    throw new AuthenticationError(
      response.status,
      response.statusText,
      await response.text(),
    );
}

export async function whoami(origin: OriginName): Promise<string | undefined> {
  const response = await post(origin, WHOAMI_ENDPOINT_FACTORY);

  switch (response.status) {
    case 200:
      return await response.text();
    case 401:
      return undefined;
    default:
      throw new AuthenticationError(
        response.status,
        response.statusText,
        await response.text(),
      );
  }
}

export async function loginAll(username: string, password: string) {
  for (const originName of ORIGIN_NAMES) {
    login(originName, username, password);
  }
}

export async function logoutAll() {
  for (const originName of ORIGIN_NAMES) {
    logout(originName);
  }
}

export async function whoamiAll(): Promise<string | undefined> {
  let previousOriginName: string | undefined | null = null;
  let currentOriginName: string | undefined = undefined;
  for (const originName of ORIGIN_NAMES) {
    currentOriginName = await whoami(originName);
    if (previousOriginName !== null && previousOriginName !== currentOriginName)
      throw "Username mismatch. Are you logged into two different accounts for different services?";
    previousOriginName = currentOriginName;
  }

  return currentOriginName;
}
