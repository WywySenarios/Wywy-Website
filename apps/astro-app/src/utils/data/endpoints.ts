import type { TableType } from "@/types/data";
import type { OriginName } from "@/types/http";
import { CACHE_URL, DATABASE_URL } from "astro:env/client";
import { useMemo } from "react";

export const endpointHelpers = {
  cache: {
    data: cacheDataEndpoint,
    descriptors: cacheDescriptorEndpoint,
    tagging: cacheTaggingEndpoint,
  },
  "master-database": {
    data: masterDatabaseDataEndpoint,
    descriptors: masterDatabaseDescriptorEndpoint,
    tagging: masterDatabaseTaggingEndpoint,
  },
} as const;

export interface DATA_ENDPOINT_PARAMS {
  databaseName: string;
  tableName: string;
}
export interface DESCRIPTOR_ENDPOINT_PARAMS {
  databaseName: string;
  tableName: string;
  descriptorName: string;
}
export interface TAGGING_ENDPOINT_PARAMS {
  databaseName: string;
  tableName: string;
  tableType: string;
}

export function cacheDataEndpoint({
  databaseName,
  tableName,
}: DATA_ENDPOINT_PARAMS): string {
  return `${CACHE_URL}/main/${databaseName}/${tableName}/data`;
}
export function cacheDescriptorEndpoint({
  databaseName,
  tableName,
  descriptorName,
}: DESCRIPTOR_ENDPOINT_PARAMS): string {
  return `${CACHE_URL}/main/${databaseName}/${tableName}/descriptors/${descriptorName}`;
}
export function cacheTaggingEndpoint({
  databaseName,
  tableName,
  tableType,
}: TAGGING_ENDPOINT_PARAMS): string {
  return `${CACHE_URL}/tags/${databaseName}/${tableName}/${tableType}`;
}

export function masterDatabaseDataEndpoint({
  databaseName,
  tableName,
}: DATA_ENDPOINT_PARAMS): string {
  return `${DATABASE_URL}/${databaseName}/${tableName}/data`;
}
export function masterDatabaseDescriptorEndpoint({
  databaseName,
  tableName,
  descriptorName,
}: DESCRIPTOR_ENDPOINT_PARAMS): string {
  return `${DATABASE_URL}/${databaseName}/${tableName}/descriptors/${descriptorName}`;
}
export function masterDatabaseTaggingEndpoint({
  databaseName,
  tableName,
  tableType,
}: TAGGING_ENDPOINT_PARAMS): string {
  return `${DATABASE_URL}/${databaseName}/${tableName}/${tableType}`;
}

/**
 * React hook for endpoint selection. Returns undefined on failure.
 * @param source The source of the endpoint.
 * @param table_type The table type.
 * @param options The options for endpoint creation. Must include the databaseName and tableName.
 * @returns
 */
export function useEndpoint(
  source: OriginName,
  table_type: TableType,
  options:
    | DATA_ENDPOINT_PARAMS
    | DESCRIPTOR_ENDPOINT_PARAMS
    | TAGGING_ENDPOINT_PARAMS,
) {
  return useMemo(() => {
    let endpointHelperTableType: "data" | "descriptors" | "tagging";
    switch (table_type) {
      case "data":
        endpointHelperTableType = "data";
        break;
      case "descriptors":
        endpointHelperTableType = "descriptors";
        break;
      case "tag_aliases":
      case "tag_groups":
      case "tag_names":
      case "tags":
        endpointHelperTableType = "tagging";
        break;
    }

    try {
      return endpointHelpers[source][endpointHelperTableType](options as any);
    } catch (error) {
      if (error instanceof Error) return undefined;
    }
  }, [source, table_type, options]);
}
