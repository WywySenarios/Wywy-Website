"use client";

import type { DescriptorInfo, TableInfo } from "@/env";
import type { JSX } from "astro/jsx-runtime";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import {
  Table,
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
  setData: Dispatch<SetStateAction<T>>
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
        let valid = true;
        let output: T = body as T;
        // special catch: no data
        if (output.data.length != 0) {
          // set the body as an invalid value if there's an issue
          // check if the columns might relate to the data
          valid = valid && output.columns.length != output.data.length;
          // check if there's any data
          valid = valid && output.columns.length != 0;

          // check if the number of entries is consistent.
          let numEntries = output.data[0].length;
          for (const column in output.data) {
            if (column.length != numEntries) {
              valid = false;
              break;
            }
          }

          if (valid) {
            setData(output);
          } else {
            setData({
              data: [],
              columns: [],
            } as TableData as T);
          }
        }

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
  data: [
    Array<string | number>,
    Array<string | number>,
    Array<string | number>,
  ];
}

interface TagNamesData extends TableData {
  columns: Array<"tag_name" | "id">;
  data: [Array<string | number>, Array<string | number>];
}

interface TagAliasesData extends TableData {
  columns: Array<"alias" | "tag_id">;
  data: [Array<string | number>, Array<string | number>];
}

interface TagGroupsData extends TableData {
  columns: Array<"id" | "tag_id" | "group_name">;
  data: [
    Array<string | number>,
    Array<string | number>,
    Array<string | number>,
  ];
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
      cacheURL
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
        {data.data[0].map((value: string | number, entryIndex: number) => {
          return (
            <TableRow key={`entry-table-row-${entryIndex}`}>
              {data.columns.map((value, columnIndex: number) => (
                <TableCell
                  key={`entry-table-cell-${columnIndex}-${entryIndex}`}
                >
                  {data.data[entryIndex][columnIndex]}
                </TableCell>
              ))}
            </TableRow>
          );
        })}
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
    data: [[], [], []],
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log(data);
  }, [data]);

  // load in data from
  useEffect(() => {
    getData(
      `${databaseURL}/${databaseName}/${tableName}/tags`,
      setLoading,
      setData
    );
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (data.data.length != 3) {
    return <p>Something went wrong!</p>;
  }

  return <></>;
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
    data: [[], []],
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log(data);
  }, [data]);

  // load in data from
  useEffect(() => {
    getData(
      `${databaseURL}/${databaseName}/${tableName}/tag_names`,
      setLoading,
      setData
    );
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (data.data.length != 2) {
    return <p>Something went wrong!</p>;
  }

  return <></>;
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
    data: [[], []],
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log(data);
  }, [data]);

  // load in data from
  useEffect(() => {
    getData(
      `${databaseURL}/${databaseName}/${tableName}/tag_aliases`,
      setLoading,
      setData
    );
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (data.data.length != 2) {
    return <p>Something went wrong!</p>;
  }

  return <></>;
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
    data: [[], [], []],
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log(data);
  }, [data]);

  // load in data from
  useEffect(() => {
    getData(
      `${databaseURL}/${databaseName}/${tableName}/tag_groups`,
      setLoading,
      setData
    );
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (data.data.length != 3) {
    return <p>Something went wrong!</p>;
  }

  return <></>;
}

export default EntryTable;
