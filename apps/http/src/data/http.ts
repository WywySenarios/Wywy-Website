import type { z, ZodType } from "zod";
import { getCSRFToken } from "../http";
import type { OriginName } from "../types";

export async function submitEntry(
  endpoint: string,
  values: Record<string, any>,
  origin?: OriginName,
): Promise<void> {
  const headers: HeadersInit = {
    "Content-type": "application/json; charset=UTF-8",
  };

  if (origin !== undefined) {
    headers["X-CSRFToken"] = await getCSRFToken(origin);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify(values),
    mode: "cors",
    credentials: "include",
    headers: headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw `Response not OK: ${response.status} ${response.statusText}; ${message}`;
  }
}

export async function safeFetchDataset<T extends ZodType<any>>(
  endpoint: string,
  schema: T,
  options: {} = {
    SELECT: "*",
    ORDER_BY: "DESC",
  },
): Promise<z.infer<T>> {
  const response = await fetch(`${endpoint}?${new URLSearchParams(options)}`, {
    method: "GET",
    mode: "cors",
    credentials: "include",
    headers: {},
  });

  if (!response.ok)
    throw `Server response not OK: ${response.status} ${response.statusText} ${await response.text()}`;
  const json = await response.json();

  const result = schema.safeParse(json);
  if (!result.success) {
    throw result.error;
  }

  if (!result.data) {
    throw "Undefined data? Contact website administrator or dev for a fix.";
  } else {
    return result.data;
  }
}
