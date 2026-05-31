import type { TableType } from "@/types/data";
import type { OriginName } from "@wywy/http/types";
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
    search: masterDatabaseSearchEndpoint,
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

export function masterDatabaseSearchEndpoint({
  databaseName,
  tableName,
}: DATA_ENDPOINT_PARAMS): string {
  return `${DATABASE_URL}/${databaseName}/${tableName}/search`;
}

export function resolveEndpoint(
  source: OriginName,
  table_type: TableType,
  options:
    | DATA_ENDPOINT_PARAMS
    | DESCRIPTOR_ENDPOINT_PARAMS
    | TAGGING_ENDPOINT_PARAMS,
) {
  let endpointHelperTableType: "data" | "descriptors" | "search" | "tagging";
  switch (table_type) {
    case "data":
      endpointHelperTableType = "data";
      break;
    case "descriptors":
      endpointHelperTableType = "descriptors";
      break;
    case "search":
      endpointHelperTableType = "search";
      break;
    case "tag_aliases":
    case "tag_groups":
    case "tag_names":
    case "tags":
      endpointHelperTableType = "tagging";
      break;
  }

  try {
    if (endpointHelperTableType === "search") {
      // search is only available on master-database
      return masterDatabaseSearchEndpoint(options as DATA_ENDPOINT_PARAMS);
    }
    return endpointHelpers[source][endpointHelperTableType]({
      ...options,
      tableType: table_type,
    } as any);
  } catch (error) {
    if (error instanceof Error) return undefined;
    throw error;
  }
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
    return resolveEndpoint(source, table_type, options);
  }, [source, table_type, options]);
}
