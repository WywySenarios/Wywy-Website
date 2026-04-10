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
 * Promise wrapper for dataset fetching.
 * @param fetchPromise
 * @param schema The zod schema to validate against.
 * @returns A promise to fetch the data.
 */
export function safeFetchDataset<T extends ZodType<any>>(
  fetchPromise: Promise<Response>,
  schema: T,
): Promise<z.infer<T>> {
  return new Promise((resolve, reject) => {
    fetchPromise
      .then((response) => {
        if (!response.ok) {
          reject(
            `Server response not OK: ${response.status} ${response.statusText}`,
          );
          return;
        }

        response
          .json()
          .then((body) => {
            const result = schema.safeParse(body);
            if (!result.success) {
              reject(result.error);
              return;
            }

            if (!result.data) {
              // if Zod's behaviour is unexpected,
              reject(
                "Undefined data? Contact website administrator or dev for a fix.",
              );
              return;
            } else {
              resolve(result.data);
            }
          })
          .catch(reject);
      })
      .catch(reject);
  });
}
