"use client";

import type { DescriptorInfo, TableInfo } from "@/env";
import type { JSX } from "astro/jsx-runtime";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Fetches the data from the endpoint and assumes the data to be of the specified type.
 * @param URL Endpoint/source URL
 * @param setLoading The function to set the loading state of the caller.
 * @param setData The function to set the data of the caller.
 */
function getData<T>(
  URL: string,
  setLoading: (value: boolean) => void,
  setData: (value: T) => void
): void {
  fetch(URL, {
    method: "GET",
    mode: "cors",
    credentials: "include",
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  }).then((response: Response) => {
    response
      .json()
      .catch((reason) => {
        toast(`Something went wrong while loading data: ${reason}`);
        setLoading(false);
      })
      .then((body: Record<string, any>) => {
        setData(body as T);
        setLoading(false);
      })
      .catch((reason) => {
        toast(`Something went wrong while loading data: ${reason}`);
        setLoading(false);
      });
  });
}

/**
 * Renders an EntryTable to view and modify entries on specific tables.
 * @param schema The schema of the table.
 * @param databaseName The name of the target database
 * @param parentTableName The name of the parent table, or the target table if the table has no parent.
 * @param tableName The name of the target table.
 * @param databaseURL The URL of the master database.
 * @param cacheURL The URL of the cache database.
 * @param type The type of table to render. Is either undefined (generic) or a tagging table type.
 * @returns an EntryTable component.
 */
function EntryTable({
  schema,
  databaseName,
  parentTableName,
  tableName,
  databaseURL,
  cacheURL,
  type,
}: {
  schema?: TableInfo | DescriptorInfo | undefined;
  databaseName: string;
  parentTableName: string;
  tableName: string;
  databaseURL: string;
  cacheURL: string;
  type?: undefined | "tags" | "tag_names" | "tag_aliases" | "tag_groups";
}): JSX.Element {
  switch (type) {
    case undefined:
      if (schema == undefined) return <NoTable />;

      return (
        <GenericEntryTable
          schema={schema}
          databaseName={databaseName}
          parentTableName={parentTableName}
          tableName={tableName}
          databaseURL={databaseURL}
          cacheURL={cacheURL}
        />
      );
    case "tags":
      return (
        <TagsTable
          databaseName={databaseName}
          parentTableName={parentTableName}
          tableName={tableName}
          databaseURL={databaseURL}
          cacheURL={cacheURL}
        />
      );
    case "tag_names":
      return (
        <TagNamesTable
          databaseName={databaseName}
          parentTableName={parentTableName}
          tableName={tableName}
          databaseURL={databaseURL}
          cacheURL={cacheURL}
        />
      );
    case "tag_aliases":
      return (
        <TagAliasesTable
          databaseName={databaseName}
          parentTableName={parentTableName}
          tableName={tableName}
          databaseURL={databaseURL}
          cacheURL={cacheURL}
        />
      );
    case "tag_groups":
      return (
        <TagGroupsTable
          databaseName={databaseName}
          parentTableName={parentTableName}
          tableName={tableName}
          databaseURL={databaseURL}
          cacheURL={cacheURL}
        />
      );
  }
}

/**
 * Component to be rendered when something is wrong. @TODO pretty up this component
 */
function NoTable(): JSX.Element {
  <p>Something went wrong.</p>;
}

/**
 * A generic entry editor table.
 * @param schema The table schema.
 * @param databaseName The name of the database that contains the target table.
 * @param parentTableName The name of the parent table (or the target table if there is no parent).
 * @param tableName The name of the target table.
 * @param databaseURL The URL of the master database.
 * @param cacheURL The URL of the cache database.
 * @returns
 */
function GenericEntryTable({
  schema,
  databaseName,
  parentTableName,
  tableName,
  databaseURL,
  cacheURL,
}: {
  schema: TableInfo | DescriptorInfo;
  databaseName: string;
  parentTableName: string;
  tableName: string;
  databaseURL: string;
  cacheURL: string;
}): JSX.Element {
  return <></>;
}

interface TaggingEntryTableProps {
  databaseName: string;
  parentTableName: string;
  tableName: string;
  databaseURL: string;
  cacheURL: string;
}

interface TagsData {
  columns: Array<"id" | "entry_id" | "tag_id">;
  data: Array<Array<string | number>>;
}

interface TagNamesData {
  columns: Array<"tag_names" | "id">;
  data: Array<Array<string | number>>;
}

interface TagAliasesData {
  columns: Array<"alias" | "tag_id">;
  data: Array<Array<string | number>>;
}

interface TagGroupsData {
  columns: Array<"id" | "tag_id" | "group_name">;
  data: Array<Array<string | number>>;
}

/**
 * A tags editor table. May add or remove tags links from tags to generic entries.
 * @param databaseName The name of the database that contains the target table.
 * @param parentTableName The name of the parent table (or the target table if there is no parent).
 * @param tableName The name of the target table.
 * @param databaseURL The URL of the master database.
 * @param cacheURL The URL of the cache database.
 * @returns
 */
function TagsTable({
  databaseName,
  parentTableName,
  tableName,
  databaseURL,
  cacheURL,
}: TaggingEntryTableProps): JSX.Element {
  const [data, setData] = useState<TagsData>();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log(data);
  }, [data]);

  // load in data from
  useEffect(() => {
    getData(
      `${databaseURL}/${databaseName}/${parentTableName}/tags`,
      setLoading,
      setData
    );
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!data) {
    return <p>Something went wrong!</p>;
  }

  return <></>;
}
/**
 * A tag name editor table. May create new tags but cannot remove old tags.
 * @param databaseName The name of the database that contains the target table.
 * @param parentTableName The name of the parent table (or the target table if there is no parent).
 * @param tableName The name of the target table.
 * @param databaseURL The URL of the master database.
 * @param cacheURL The URL of the cache database.
 * @returns
 */
function TagNamesTable({
  databaseName,
  parentTableName,
  tableName,
  databaseURL,
  cacheURL,
}: TaggingEntryTableProps): JSX.Element {
  const [data, setData] = useState<TagNamesData>();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log(data);
  }, [data]);

  // load in data from
  useEffect(() => {
    getData(
      `${databaseURL}/${databaseName}/${parentTableName}/tag_names`,
      setLoading,
      setData
    );
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!data) {
    return <p>Something went wrong!</p>;
  }

  return <></>;
}
/**
 * A tags aliases table. May create or remove tag aliases. The user is not prevented from removing all aliases from a given tag, nor are they barred from removing the respective tag's direct name.
 * @param databaseName The name of the database that contains the target table.
 * @param parentTableName The name of the parent table (or the target table if there is no parent).
 * @param tableName The name of the target table.
 * @param databaseURL The URL of the master database.
 * @param cacheURL The URL of the cache database.
 * @returns
 */
function TagAliasesTable({
  databaseName,
  parentTableName,
  tableName,
  databaseURL,
  cacheURL,
}: TaggingEntryTableProps): JSX.Element {
  const [data, setData] = useState<TagAliasesData>();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log(data);
  }, [data]);

  // load in data from
  useEffect(() => {
    getData(
      `${databaseURL}/${databaseName}/${parentTableName}/tag_aliases`,
      setLoading,
      setData
    );
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!data) {
    return <p>Something went wrong!</p>;
  }

  return <></>;
}
/**
 * A tag group editor table. May create or remove links from tags to tag groups.
 * @param databaseName The name of the database that contains the target table.
 * @param parentTableName The name of the parent table (or the target table if there is no parent).
 * @param tableName The name of the target table.
 * @param databaseURL The URL of the master database.
 * @param cacheURL The URL of the cache database.
 * @returns
 */
function TagGroupsTable({
  databaseName,
  parentTableName,
  tableName,
  databaseURL,
  cacheURL,
}: TaggingEntryTableProps): JSX.Element {
  const [data, setData] = useState<TagGroupsData>();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log(data);
  }, [data]);

  // load in data from
  useEffect(() => {
    getData(
      `${databaseURL}/${databaseName}/${parentTableName}/tag_groups`,
      setLoading,
      setData
    );
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!data) {
    return <p>Something went wrong!</p>;
  }

  return <></>;
}

export default EntryTable;
