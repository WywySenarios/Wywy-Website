export async function getCSRFToken(cacheURL: string): Promise<string> {
  const csrfResponse: Response = await fetch(`${cacheURL}/cache/csrf`, {
    mode: "cors",
    credentials: "include",
  });

  if (!csrfResponse.ok)
    throw new Error(`Failed to contact cache at ${cacheURL}/cache/csrf`);
  const csrfJSON: Object = await csrfResponse.json();
  if ("csrfToken" in csrfJSON) return String(csrfJSON["csrfToken"]);
  throw new Error(`Unexpected output from cache.`);
}
