import type { z, ZodType } from "zod";
import { getCSRFToken } from "../auth";

/**
 * Asynchronous entry submission to an undetermined endpoint.
 * @param endpoint
 * @param values
 * @param csrfEndpoint The endpoint to fetch a CSRF token from.
 * @returns
 */
export async function submitEntry(
  endpoint: string,
  values: Record<string, any>,
  csrfEndpoint?: string,
): Promise<void> {
  console.log(`POSTING to: ${endpoint}`);
  console.log(values);

  const headers: HeadersInit = {
    "Content-type": "application/json; charset=UTF-8",
  };

  if (csrfEndpoint !== undefined) {
    headers["X-CSRFToken"] = await getCSRFToken(csrfEndpoint);
  }

  fetch(endpoint, {
    method: "POST",
    body: JSON.stringify(values),
    mode: "cors",
    credentials: "include",
    headers: headers,
  });
}

/**
 * Asynchronous dataset validation with schema validation.
 * @param endpoint The endpoint to GET from.
 * @param schema The zod schema to validate against.
 * @returns A promise to fetch the data.
 */
export async function safeFetchDataset<T extends ZodType<any>>(
  endpoint: string,
  schema: T,
): Promise<z.infer<T>> {
  const response = await fetch(endpoint, {
    method: "GET",
    mode: "cors",
    credentials: "include",
    headers: {},
  });

  if (!response.ok)
    throw `Server response not OK: ${response.status} ${response.statusText}`;
  const json = await response.json();

  const result = schema.safeParse(json);
  if (!result.success) {
    throw result.error;
  }

  if (!result.data) {
    // if Zod's behaviour is unexpected,
    throw "Undefined data? Contact website administrator or dev for a fix.";
  } else {
    return result.data;
  }
}
