import type { OriginName } from "./types";

const CACHE_URL = typeof process !== "undefined" ? process.env.CACHE_URL : undefined;
const DATABASE_URL = typeof process !== "undefined" ? process.env.DATABASE_URL : undefined;

export const ORIGIN_NAMES = ["master-database", "cache"] as const;

export const CSRF_ENDPOINTS = {
  "master-database": undefined,
  cache: `${CACHE_URL}/cache/csrf`,
} as const;

export function CSRF_ENDPOINT_FACTORY(origin: OriginName) {
  return CSRF_ENDPOINTS[origin];
}

export const LOGIN_ENDPOINTS = {
  "master-database": `${DATABASE_URL}/auth`,
  cache: `${CACHE_URL}/auth/login`,
} as const;

export function LOGIN_ENDPOINT_FACTORY(origin: OriginName) {
  return LOGIN_ENDPOINTS[origin];
}

export const LOGOUT_ENDPOINTS = {
  "master-database": `${DATABASE_URL}/auth/logout`,
  cache: `${CACHE_URL}/auth/logout`,
} as const;

export function LOGOUT_ENDPOINT_FACTORY(origin: OriginName) {
  return LOGOUT_ENDPOINTS[origin];
}

export const WHOAMI_ENDPOINTS = {
  "master-database": `${DATABASE_URL}/auth/whoami`,
  cache: `${CACHE_URL}/auth/whoami`,
} as const;

export function WHOAMI_ENDPOINT_FACTORY(origin: OriginName) {
  return WHOAMI_ENDPOINTS[origin];
}
