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
import { Plus, RefreshCw } from "lucide-react";
import { CACHE_URL, DATABASE_URL } from "astro:env/client";
import { OriginPicker } from "@/components/data/origin-picker";

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
      if (!response.ok) {
        response
          .text()
          .then((body: string) => {
            toast(
              `Something went wrong while fetching data: ${response.statusText}: ${body}`,
            );
          })
          .catch((reason) => {
            toast(
              `Something went wrong while fetching data: ${response.statusText}: ${reason}`,
            );
          });

        return;
      }

      response
        .json()
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
          toast(`Something went wrong while parsing data: ${reason}`);
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
 * @param type The type of table to render. Is either undefined (generic) or a tagging table type.
 * @returns an EntryTable component.
 */
function EntryTable({
  schema,
  databaseName,
  tableName,
  type,
}: {
  schema?: TableInfo | DescriptorInfo | undefined;
  databaseName: string;
  tableName: string;
  type?: undefined | "tags" | "tag_names" | "tag_aliases" | "tag_groups";
}): JSX.Element {
  const [origin, setOrigin] = useState<string>(DATABASE_URL);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  let endpoint;
  switch (origin) {
    case DATABASE_URL:
      endpoint = `${DATABASE_URL}`;
      break;
    case CACHE_URL:
      endpoint = `${CACHE_URL}/main`;
      break;
    default:
      return <p>Something went wrong while picking the Origin to read from.</p>;
  }
  let table: JSX.Element = null;
  // params applicable to every type of entry table
  const genericEntryTableParams: EntryTableProps = {
    databaseName: databaseName,
    tableName: tableName,
    endpoint: endpoint,
    refreshTrigger: refreshTrigger,
  };

  switch (type) {
    case undefined:
      if (schema == undefined) return <NoTable />;

      table = (
        <GenericEntryTable schema={schema} {...genericEntryTableParams} />
      );
      break;
    case "tags":
      table = <TagsTable {...genericEntryTableParams} />;
      break;
    case "tag_names":
      table = <TagNamesTable {...genericEntryTableParams} />;
      break;
    case "tag_aliases":
      table = <TagAliasesTable {...genericEntryTableParams} />;
      break;
    case "tag_groups":
      table = <TagGroupsTable {...genericEntryTableParams} />;
      break;
  }

  return (
    <div>
      <div className="flex flex-row justify-center space-x-0.5">
        <OriginPicker origin={origin} setOrigin={setOrigin} />
        <Button
          onClick={() => {
            setRefreshTrigger(refreshTrigger + 1);
          }}
        >
          <RefreshCw />
        </Button>
      </div>
      {table}
    </div>
  );
}

/**
 * Component to be rendered when something is wrong. @TODO pretty up this component
 */
function NoTable(): JSX.Element {
  <p>Something went wrong.</p>;
}

interface EntryTableProps {
  databaseName: string;
  tableName: string;
  endpoint: string;
  refreshTrigger: number;
}

interface TableData {
  columns: Array<string>;
  data: Array<Array<string | number>>;
}

interface GenericEntryTableProps extends EntryTableProps {
  schema: TableInfo | DescriptorInfo;
}

/**
 * A generic entry editor table.
 * @param schema The table schema.
 * @param databaseName The name of the database that contains the target table.
 * @param tableName The name of the parent table (or the target table if there is no parent).
 * @param endpoint The endpoint prefix to get data from. (i.e. DATABASE_URL or CACHE_URL/main)
 * @param refreshTrigger A controlled field to trigger a refresh through useEffect.
 * @returns
 */
function GenericEntryTable({
  schema,
  databaseName,
  tableName,
  endpoint,
  refreshTrigger,
}: GenericEntryTableProps): JSX.Element {
  return <></>;
}

interface TaggingEntryTableProps extends EntryTableProps {}

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

/**
 * Render a table full of data and a form at the bottom to insert new entries in.
 * @param data The data to render.
 * @param databaseName The name of the respective database.
 * @param tableName The name of the respective table.
 * @param type The type of TaggingTable to render.
 * @returns
 */
function TaggingTable({
  data,
  databaseName,
  tableName,
  type,
}: {
  data: TableData;
  databaseName: string;
  tableName: string;
  type: "tags" | "tag_names" | "tag_aliases" | "tag_groups";
}) {
  const { controller, onSubmit, onSubmitInvalid } =
    createTaggingTableFormSchemaAndHandlers(
      databaseName,
      tableName,
      type,
      CACHE_URL,
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
 * @param endpoint The endpoint prefix to get data from. (i.e. DATABASE_URL or CACHE_URL/main)
 * @param refreshTrigger A controlled field to trigger a refresh through useEffect.
 * @returns
 */
function TagsTable({
  databaseName,
  tableName,
  endpoint,
  refreshTrigger,
}: TaggingEntryTableProps): JSX.Element {
  const [data, setData] = useState<TagsData>({
    columns: ["id", "entry_id", "tag_id"],
    data: [],
  });
  const [loading, setLoading] = useState<boolean>(true);

  // load in data from
  useEffect(() => {
    getData(
      `${endpoint}/${databaseName}/${tableName}/tags`,
      setLoading,
      setData,
    );
  }, [endpoint, refreshTrigger]);

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
    />
  );
}
/**
 * A tag name editor table. May create new tags but cannot remove old tags.
 * @param databaseName The name of the database that contains the target table.
 * @param tableName The name of the parent table (or the target table if there is no parent).
 * @param endpoint The endpoint prefix to get data from. (i.e. DATABASE_URL or CACHE_URL/main)
 * @param refreshTrigger A controlled field to trigger a refresh through useEffect.
 * @returns
 */
function TagNamesTable({
  databaseName,
  tableName,
  endpoint,
  refreshTrigger,
}: TaggingEntryTableProps): JSX.Element {
  const [data, setData] = useState<TagNamesData>({
    columns: ["id", "tag_name"],
    data: [],
  });
  const [loading, setLoading] = useState<boolean>(true);

  // load in data from
  useEffect(() => {
    getData(
      `${endpoint}/${databaseName}/${tableName}/tag_names`,
      setLoading,
      setData,
    );
  }, [endpoint, refreshTrigger]);

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
    />
  );
}
/**
 * A tags aliases table. May create or remove tag aliases. The user is not prevented from removing all aliases from a given tag, nor are they barred from removing the respective tag's direct name.
 * @param databaseName The name of the database that contains the target table.
 * @param tableName The name of the parent table (or the target table if there is no parent).
 * @param endpoint The endpoint prefix to get data from. (i.e. DATABASE_URL or CACHE_URL/main)
 * @param refreshTrigger A controlled field to trigger a refresh through useEffect.
 * @returns
 */
function TagAliasesTable({
  databaseName,
  tableName,
  endpoint,
  refreshTrigger,
}: TaggingEntryTableProps): JSX.Element {
  const [data, setData] = useState<TagAliasesData>({
    columns: ["alias", "tag_id"],
    data: [],
  });
  const [loading, setLoading] = useState<boolean>(true);

  // load in data from
  useEffect(() => {
    getData(
      `${endpoint}/${databaseName}/${tableName}/tag_aliases`,
      setLoading,
      setData,
    );
  }, [endpoint, refreshTrigger]);

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
    />
  );
}
/**
 * A tag group editor table. May create or remove links from tags to tag groups.
 * @param databaseName The name of the database that contains the target table.
 * @param tableName The name of the parent table (or the target table if there is no parent).
 * @param endpoint The endpoint prefix to get data from. (i.e. DATABASE_URL or CACHE_URL/main)
 * @param refreshTrigger A controlled field to trigger a refresh through useEffect.
 * @returns
 */
function TagGroupsTable({
  databaseName,
  tableName,
  endpoint,
  refreshTrigger,
}: TaggingEntryTableProps): JSX.Element {
  const [data, setData] = useState<TagGroupsData>({
    columns: ["id", "tag_id", "group_name"],
    data: [],
  });
  const [loading, setLoading] = useState<boolean>(true);

  // load in data from
  useEffect(() => {
    getData(
      `${endpoint}/${databaseName}/${tableName}/tag_groups`,
      setLoading,
      setData,
    );
  }, [endpoint, refreshTrigger]);

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
    />
  );
}

export default EntryTable;
