"use client";

import type { DescriptorInfo, TableInfo } from "@/env";
import type { JSX } from "astro/jsx-runtime";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createTaggingTableFormSchemaAndHandlers } from "./entry-form-helper";
import { TaggingTableEntry } from "./entry";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

/**
 * Fetches the data from the endpoint and assumes the data to be of the specified type.
 * @param URL Endpoint/source URL
 * @param setLoading The function to set the loading state of the caller.
 * @param setData The function to set the data of the caller.
 */
function getData<T extends TableData>(
  URL: string,
  setLoading: Dispatch<SetStateAction<boolean>>,
  setData: Dispatch<SetStateAction<T>>,
): void {
  fetch(URL, {
    method: "GET",
    mode: "cors",
    credentials: "include",
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  })
    .then((response: Response) => {
      response
        .json()
        .catch((reason) => {
          toast(`Something went wrong while loading data: ${reason}`);
          setLoading(false);
        })
        .then((body: Record<string, any>) => {
          let valid = true;
          let output: T = body as T;

          setLoading(false);
          // fallback value (erroneous, so the component will realize something is wrong)
          setData({
            data: [],
            columns: [],
          } as TableData as T);

          // validate data
          // validate the amount of columns inside every row of data
          let numEntries = output.columns.length;
          for (const row of output.data) {
            if (row.length != numEntries) return;
          }

          setData(output);
        })
        .catch((reason) => {
          toast(`Something went wrong while loading data: ${reason}`);
          setLoading(false);
        });
    })
    .catch((reason: any) => {
      toast(`Something went wrong while contacting the cache: ${reason}`);
      setLoading(false);
    });
}

/**
 * Renders an EntryTable to view and modify entries on specific tables.
 * @param schema The schema of the table.
 * @param databaseName The name of the target database
 * @param tableName The name of the parent table, or the target table if the table has no parent.
 * @param databaseURL The URL of the master database.
 * @param cacheURL The URL of the cache database.
 * @param type The type of table to render. Is either undefined (generic) or a tagging table type.
 * @returns an EntryTable component.
 */
function EntryTable({
  schema,
  databaseName,
  tableName,
  databaseURL,
  cacheURL,
  type,
}: {
  schema?: TableInfo | DescriptorInfo | undefined;
  databaseName: string;
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
          tableName={tableName}
          databaseURL={databaseURL}
          cacheURL={cacheURL}
        />
      );
    case "tags":
      return (
        <TagsTable
          databaseName={databaseName}
          tableName={tableName}
          databaseURL={databaseURL}
          cacheURL={cacheURL}
        />
      );
    case "tag_names":
      return (
        <TagNamesTable
          databaseName={databaseName}
          tableName={tableName}
          databaseURL={databaseURL}
          cacheURL={cacheURL}
        />
      );
    case "tag_aliases":
      return (
        <TagAliasesTable
          databaseName={databaseName}
          tableName={tableName}
          databaseURL={databaseURL}
          cacheURL={cacheURL}
        />
      );
    case "tag_groups":
      return (
        <TagGroupsTable
          databaseName={databaseName}
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
 * @param tableName The name of the parent table (or the target table if there is no parent).
 * @param databaseURL The URL of the master database.
 * @param cacheURL The URL of the cache database.
 * @returns
 */
function GenericEntryTable({
  schema,
  databaseName,
  tableName,
  databaseURL,
  cacheURL,
}: {
  schema: TableInfo | DescriptorInfo;
  databaseName: string;
  tableName: string;
  databaseURL: string;
  cacheURL: string;
}): JSX.Element {
  return <></>;
}

interface TaggingEntryTableProps {
  databaseName: string;
  tableName: string;
  databaseURL: string;
  cacheURL: string;
}

interface TableData {
  columns: Array<string>;
  data: Array<Array<string | number>>;
}

interface TagsData extends TableData {
  columns: Array<"id" | "entry_id" | "tag_id">;
}

interface TagNamesData extends TableData {
  columns: Array<"tag_name" | "id">;
}

interface TagAliasesData extends TableData {
  columns: Array<"alias" | "tag_id">;
}

interface TagGroupsData extends TableData {
  columns: Array<"id" | "tag_id" | "group_name">;
}

function TaggingTable({
  data,
  databaseName,
  tableName,
  type,
  cacheURL,
}: {
  data: TableData;
  databaseName: string;
  tableName: string;
  type: "tags" | "tag_names" | "tag_aliases" | "tag_groups";
  cacheURL: string;
}) {
  const { controller, onSubmit, onSubmitInvalid } =
    createTaggingTableFormSchemaAndHandlers(
      databaseName,
      tableName,
      type,
      cacheURL,
    );

  return (
    <form onSubmit={controller.handleSubmit(onSubmit, onSubmitInvalid)}>
      <Table>
        <TableHeader>
          <TableRow>
            {data.columns.map((columnName: string) => (
              <TableHead
                className="text-center"
                key={`entry-table-head-${columnName}`}
              >
                {columnName}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.data.map((row: Array<string | number>, entryIndex: number) => (
            <TableRow key={`entry-table-row-${entryIndex}`}>
              {row.map((value: string | number, columnIndex: number) => (
                <TableCell
                  key={`entry-table-cell-${columnIndex}-${entryIndex}`}
                >
                  {value}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            {data.columns.map((columnName: string) => (
              <TableCell key={`entry-table-footer-${columnName}`}>
                <TaggingTableEntry controller={controller} name={columnName} />
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>
      <Button className="w-full" type="submit">
        <Plus />
      </Button>
    </form>
  );
}

/**
 * A tags editor table. May add or remove tags links from tags to generic entries.
 * @param databaseName The name of the database that contains the target table.
 * @param tableName The name of the parent table (or the target table if there is no parent).
 * @param databaseURL The URL of the master database.
 * @param cacheURL The URL of the cache database.
 * @returns
 */
function TagsTable({
  databaseName,
  tableName,
  databaseURL,
  cacheURL,
}: TaggingEntryTableProps): JSX.Element {
  const [data, setData] = useState<TagsData>({
    columns: ["id", "entry_id", "tag_id"],
    data: [],
  });
  const [loading, setLoading] = useState<boolean>(true);

  // load in data from
  useEffect(() => {
    getData(
      `${databaseURL}/${databaseName}/${tableName}/tags`,
      setLoading,
      setData,
    );
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (data.columns.length != 3) {
    return <p>Something went wrong!</p>;
  }

  return (
    <TaggingTable
      data={data}
      databaseName={databaseName}
      tableName={tableName}
      type="tags"
      cacheURL={cacheURL}
    />
  );
}
/**
 * A tag name editor table. May create new tags but cannot remove old tags.
 * @param databaseName The name of the database that contains the target table.
 * @param tableName The name of the parent table (or the target table if there is no parent).
 * @param databaseURL The URL of the master database.
 * @param cacheURL The URL of the cache database.
 * @returns
 */
function TagNamesTable({
  databaseName,
  tableName,
  databaseURL,
  cacheURL,
}: TaggingEntryTableProps): JSX.Element {
  const [data, setData] = useState<TagNamesData>({
    columns: ["id", "tag_name"],
    data: [],
  });
  const [loading, setLoading] = useState<boolean>(true);

  // load in data from
  useEffect(() => {
    getData(
      `${databaseURL}/${databaseName}/${tableName}/tag_names`,
      setLoading,
      setData,
    );
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (data.columns.length != 2) {
    return <p>Something went wrong!</p>;
  }

  return (
    <TaggingTable
      data={data}
      databaseName={databaseName}
      tableName={tableName}
      type="tag_names"
      cacheURL={cacheURL}
    />
  );
}
/**
 * A tags aliases table. May create or remove tag aliases. The user is not prevented from removing all aliases from a given tag, nor are they barred from removing the respective tag's direct name.
 * @param databaseName The name of the database that contains the target table.
 * @param tableName The name of the parent table (or the target table if there is no parent).
 * @param databaseURL The URL of the master database.
 * @param cacheURL The URL of the cache database.
 * @returns
 */
function TagAliasesTable({
  databaseName,
  tableName,
  databaseURL,
  cacheURL,
}: TaggingEntryTableProps): JSX.Element {
  const [data, setData] = useState<TagAliasesData>({
    columns: ["alias", "tag_id"],
    data: [],
  });
  const [loading, setLoading] = useState<boolean>(true);

  // load in data from
  useEffect(() => {
    getData(
      `${databaseURL}/${databaseName}/${tableName}/tag_aliases`,
      setLoading,
      setData,
    );
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (data.columns.length != 2) {
    return <p>Something went wrong!</p>;
  }

  return (
    <TaggingTable
      data={data}
      databaseName={databaseName}
      tableName={tableName}
      type="tag_aliases"
      cacheURL={cacheURL}
    />
  );
}
/**
 * A tag group editor table. May create or remove links from tags to tag groups.
 * @param databaseName The name of the database that contains the target table.
 * @param tableName The name of the parent table (or the target table if there is no parent).
 * @param databaseURL The URL of the master database.
 * @param cacheURL The URL of the cache database.
 * @returns
 */
function TagGroupsTable({
  databaseName,
  tableName,
  databaseURL,
  cacheURL,
}: TaggingEntryTableProps): JSX.Element {
  const [data, setData] = useState<TagGroupsData>({
    columns: ["id", "tag_id", "group_name"],
    data: [],
  });
  const [loading, setLoading] = useState<boolean>(true);

  // load in data from
  useEffect(() => {
    getData(
      `${databaseURL}/${databaseName}/${tableName}/tag_groups`,
      setLoading,
      setData,
    );
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (data.columns.length != 3) {
    return <p>Something went wrong!</p>;
  }

  return (
    <TaggingTable
      data={data}
      databaseName={databaseName}
      tableName={tableName}
      type="tag_groups"
      cacheURL={cacheURL}
    />
  );
}

export default EntryTable;
