"use client";

import { DATABASE_URL } from "astro:env/client";
import { useEffect, useRef, useState } from "react";
import { toSnakeCase } from "../parse";

export type SearchResult = { id: number; label: string };

/**
 * Performs a GET request to the search endpoint with an AbortSignal.
 * Returns the parsed SearchResult array. Throws on non-OK or parse failure.
 */
export async function safeSearchFetch(
  endpoint: string,
  q: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const response = await fetch(`${endpoint}?q=${encodeURIComponent(q)}`, {
    method: "GET",
    mode: "cors",
    credentials: "include",
    signal,
  });
  if (!response.ok) {
    throw `Search request failed: ${response.status} ${response.statusText}`;
  }
  const json: unknown = await response.json();
  if (!Array.isArray(json)) {
    throw "Search response is not an array";
  }
  return json as SearchResult[];
}

/**
 * React hook for debounced server-side search.
 * Fires a GET to the master-database search endpoint when `q` settles.
 * Cancels in-flight requests on new keystroke or unmount.
 */
export function useSearch({
  databaseName,
  tableName,
  q,
  debounceMs = 300,
  minLength = 1,
}: {
  databaseName: string;
  tableName: string;
  q: string;
  debounceMs?: number;
  minLength?: number;
}): [SearchResult[], boolean, string] {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (q.length < minLength) {
      setResults([]);
      setError("");
      setLoading(false);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();

      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError("");

      const endpoint = `${DATABASE_URL}/${toSnakeCase(databaseName)}/${toSnakeCase(tableName)}/search`;

      safeSearchFetch(endpoint, q, controller.signal)
        .then((data) => {
          setResults(data);
          setLoading(false);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setError(String(err));
          setLoading(false);
        });
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [databaseName, tableName, q, debounceMs, minLength]);

  // Abort in-flight on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return [results, loading, error];
}
