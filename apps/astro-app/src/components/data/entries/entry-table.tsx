"use client";

import type { DescriptorInfo, TableInfo } from "@/env";
import type { JSX } from "astro/jsx-runtime";
import { Table } from "@/components/ui/table";

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
}: TaggingEntryTableProps): JSX.Element {
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
}: TaggingEntryTableProps): JSX.Element {
  function onSubmit() {
    //
  }
  return <Table></Table>;
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
}: TaggingEntryTableProps): JSX.Element {
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
}: TaggingEntryTableProps): JSX.Element {
  return <></>;
}

export default EntryTable;
