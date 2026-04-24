"use client";

import type { z, ZodType } from "zod";
import { getCSRFToken } from "../auth";
import { CACHE_URL, DATABASE_URL } from "astro:env/client";
import { useEffect, useMemo, useState } from "react";
import type {
  Dataset,
  DescriptorInfo,
  TableInfo,
  TableType,
} from "@/types/data";
import {
  getZodDatasetType,
  TAG_ALIASES_DATASET_SCHEMA,
  TAG_GROUPS_DATASET_SCHEMA,
  TAG_NAMES_DATASET_SCHEMA,
  TAGS_DATASET_SCHEMA,
} from "./schema";
import { resolveEndpoint, useEndpoint } from "./endpoints";
import type { OriginName } from "@/types/http";
import { toSnakeCase } from "@utils/parse";

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
  const headers: HeadersInit = {
    "Content-type": "application/json; charset=UTF-8",
  };

  if (csrfEndpoint !== undefined) {
    headers["X-CSRFToken"] = await getCSRFToken(csrfEndpoint);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify(values),
    mode: "cors",
    credentials: "include",
    headers: headers,
  });

  if (!response.ok) {
    throw `Response not OK: ${response.status} ${response.statusText}`;
  }
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

export interface useDatasetProps {
  valid: boolean;
  table_type: TableType;
  schema: TableInfo | DescriptorInfo | undefined;
  source: OriginName;
  endpointOptions: {
    databaseName: string;
    tableName: string;
    descriptorName?: string;
    tableType?: string;
  };
  refreshState?: any;
  options?: Record<string, any>;
}

/**
 * React hook for dataset fetching.
 * @param valid Whether or not the given parameters are valid (i.e. whether or not the dataset is ready to be fetched)
 * @param table_type The type of the dataset to fetch.
 * @param schema The related configuration schema (if available) of the dataset to fetch.
 * @param source The source to consturct an endpoint off of.
 * @param endpointOptions The options for the endpoint construction.
 * @param refreshState A refreshState to update the dataset when desried. This is optional.
 * @param options The options for dataset fetching.
 * @returns The dataset, the loading state, and an error message (empty (but not necessarily falsy) if there is no error).
 */
export function useDataset({
  valid,
  table_type,
  schema,
  source,
  endpointOptions,
  refreshState,
  options = {},
}: useDatasetProps): [Dataset | null, boolean, string] {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const datasetSchema = useMemo(() => {
    switch (table_type) {
      case "data":
      case "descriptors":
        if (schema === undefined) throw TypeError("Undefined schema.");

        return getZodDatasetType(
          schema["schema"],
          "tagging" in schema ? schema["tagging"] : false,
        );
      case "tag_aliases":
        return TAG_ALIASES_DATASET_SCHEMA;
      case "tags":
        return TAGS_DATASET_SCHEMA;
      case "tag_names":
        return TAG_NAMES_DATASET_SCHEMA;
      case "tag_groups":
        return TAG_GROUPS_DATASET_SCHEMA;
    }
  }, [table_type, schema]);
  const endpoint = useEndpoint(source, table_type, endpointOptions);
  const [dataset, setDataset] = useState<Dataset | null>(null);

  useEffect(() => {
    if (!valid) return;
    if (loading) return; // avoid race condition

    if (endpoint === undefined) {
      setError("Invalid endpoint.");
      return;
    }

    setLoading(true);
    setError("");

    safeFetchDataset(endpoint, datasetSchema, options)
      .then((newDataset) => {
        setDataset(newDataset);
        setLoading(false);
      })
      .catch((msg) => {
        setError(msg);
        setLoading(false);
      });
  }, [valid, refreshState, endpoint, datasetSchema]);

  return [loading ? null : dataset, loading, error];
}

/**
 * React hook for related descriptor dataset fetching.
 * @param valid Whether or not the given parameters are valid (i.e. whether or not the dataset is ready to be fetched)
 * @param table_type The type of the dataset to fetch.
 * @param schema The related configuration schema (if available) of the dataset to fetch.
 * @param source The source to consturct an endpoint off of.
 * @param endpointOptions The options for the endpoint construction.
 * @param refreshState A refreshState to update the dataset when desried. This is optional.
 * @param options The options for dataset fetching.
 * @returns The dataset, the loading state, and an error message (empty (but not necessarily falsy) if there is no error).
 */
export function useDescriptorDatasets({
  valid,
  table_type,
  schema,
  source,
  endpointOptions,
  refreshState,
  options = {},
}: useDatasetProps): [Record<string, Dataset> | null, boolean, string] {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const datasetSchemas = useMemo(() => {
    if (!schema) return {};
    if (!("descriptors" in schema)) return {};

    const schemas: Record<string, any> = {};

    for (const descriptorInfo of schema["descriptors"]) {
      schemas[toSnakeCase(descriptorInfo.name)] = getZodDatasetType(
        descriptorInfo["schema"],
      );
    }

    return schemas;
  }, [table_type, schema]);
  const [datasets, setDatasets] = useState<Record<string, Dataset>>({});

  useEffect(() => {
    if (!valid) return;
    if (loading) return; // avoid race condition

    setLoading(true);
    setError("");
    let error = "";

    const promises: Array<Promise<any>> = [];

    for (const descriptorName in datasetSchemas) {
      const endpoint = resolveEndpoint(source, "descriptors", {
        ...endpointOptions,
        descriptorName: descriptorName,
      });
      if (endpoint === undefined) {
        setError(
          `Failed to construct endpoint for descriptor ${descriptorName}.`,
        );
        setLoading(false);
        return;
      }

      promises.push(
        safeFetchDataset(endpoint, datasetSchemas[descriptorName], options)
          .then((newDataset) => {
            datasets[descriptorName] = newDataset;
          })
          .catch((msg) => {
            error += `${msg}\n`;
          }),
      );
    }

    Promise.allSettled(promises).then(() => {
      setError(error);
      setLoading(false);
    });
  }, [valid, refreshState, datasetSchemas, table_type, schema]);

  return [loading ? null : datasets, loading, error];
}
