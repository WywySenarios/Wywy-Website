"use client";

import { safeFetchDataset } from "@wywy/http/data/http";
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
import type { OriginName } from "@wywy/http/types";
import { toSnakeCase } from "@utils/parse";

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
      default:
        throw new Error(`Unexpected table_type: ${table_type}`);
    }
  }, [table_type, schema]);
  const endpoint = useEndpoint(source, table_type, endpointOptions);
  const [dataset, setDataset] = useState<Dataset | null>(null);

  useEffect(() => {
    if (!valid) return;
    if (loading) return;

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
    if (loading) return;

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
