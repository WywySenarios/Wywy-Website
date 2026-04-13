"use client";

import type { Dataset, DescriptorInfo, TableInfo } from "@/types/data";
import type { JSX } from "astro/jsx-runtime";
import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
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
import { TaggingTableEntry } from "./entry";
import { Button } from "@/components/ui/button";
import { CloudDownload, Plus, RefreshCw } from "lucide-react";
import { CACHE_URL, DATABASE_URL } from "astro:env/client";
import { OriginPicker } from "@/components/data/origin-picker";
import { CACHE_CSRF_ENDPOINT, getCSRFToken } from "@utils/auth";
import {
  getZodDatasetType,
  TAGGING_TABLE_TAG_ALIASES_SCHEMA,
  TAGGING_TABLE_TAG_GROUPS_SCHEMA,
  TAGGING_TABLE_TAG_NAMES_SCHEMA,
  TAGGING_TABLE_TAGS_SCHEMA,
} from "@utils/data/schema";
import { safeFetchDataset, submitEntry } from "@utils/data/http";
import { z, type ZodType } from "zod";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toSnakeCase } from "@utils/parse";

/**
 * Fetches the data from the endpoint and assumes the data to be of the specified type.
 * @param URL Endpoint/source URL
 * @param setLoading The function to set the loading state of the caller.
 * @param setData The function to set the data of the caller.
 * @param schema Zod schema to validate against.
 */
function getData<T extends Dataset>(
  URL: string,
  setLoading: Dispatch<SetStateAction<boolean>>,
  setData: Dispatch<SetStateAction<T | undefined>>,
  schema: ZodType<any>,
): void {
  safeFetchDataset(URL, schema)
    .then((dataset) => {
      setData(dataset as T);
    })
    .catch((reason) => {
      toast(`An error occurred while fetching data: ${reason}`);
      setData(undefined);
    })
    .finally(() => {
      setLoading(false);
    });
}

function DatasetTable({
  dataset,
  footer = null,
}: {
  dataset: Dataset;
  footer?: null | ReactNode;
}) {
  return (
    <ScrollArea orientation="horizontal">
      <Table>
        <TableHeader>
          <TableRow>
            {dataset.columns.map((columnName: string) => (
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
          {dataset.data.map(
            (row: Array<string | number>, entryIndex: number) => (
              <TableRow key={`entry-table-row-${entryIndex}`}>
                {row.map((value: string | number, columnIndex: number) => (
                  <TableCell
                    key={`entry-table-cell-${columnIndex}-${entryIndex}`}
                  >
                    {String(value)}
                  </TableCell>
                ))}
              </TableRow>
            ),
          )}
        </TableBody>
        {footer}
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
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
  type?:
    | undefined
    | "tags"
    | "tag_names"
    | "tag_aliases"
    | "tag_groups"
    | "descriptors"
    | "data";
}): JSX.Element {
  const [origin, setOrigin] = useState<string>(DATABASE_URL);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [pullTrigger, setPullTrigger] = useState<number>(0);
  let disablePullTrigger = true;

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

  useEffect(() => {
    // this only applies for the cache
    if (origin != CACHE_URL) return;

    // do not call when initially loading the webpage
    if (pullTrigger == 0) return;

    // only request refreshes on tags, tag_names, and tag_alaises tables.
    switch (type) {
      case "tags":
        break;
      case "tag_names":
        break;
      case "tag_aliases":
        break;
      default:
        toast(
          "You may only refresh these tables: tags, tag_names, tag_aliases.",
        );
        return;
    }

    // tell the cache to fetch data from the master database.
    getCSRFToken(CACHE_CSRF_ENDPOINT)
      .catch((reason: any) => {
        toast(`Failed to request cache data update: ${reason}`);
      })
      .then((csrftoken: string | void) => {
        if (!csrftoken) {
          toast(`Failed to request cache data update: Invalid CSRF token.`);
          return;
        }
        fetch(`${CACHE_URL}/refresh/${databaseName}/${tableName}/${type}`, {
          method: "POST",
          mode: "cors",
          credentials: "include",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            "X-CSRFToken": csrftoken,
          },
        })
          .catch((reason: any) => {
            toast(`Failed to request cache data update: ${reason}`);
          })
          .then((response: Response | void) => {
            if (!response) {
              toast(`Failed to request cache data update: No response.`);
              return;
            } else if (!response.ok) {
              response
                .text()
                .catch((reason: any) => {
                  toast(`Failed to request cache data update: ${reason}`);
                })
                .then((text: string | void) => {
                  if (!text) {
                    toast(
                      `Failed to request cache data update. No reason provided.`,
                    );
                  }

                  toast(`Failed to request cache data update: ${text}`);
                });
              return;
            }

            toast(`Successfully requested cache update.`);
          });
      });
  }, [pullTrigger]);

  switch (type) {
    case undefined:
    case "data":
    case "descriptors":
      if (schema == undefined) return <NoTable />;

      table = (
        <GenericEntryTable
          type={type ? type : "data"}
          schema={schema}
          {...genericEntryTableParams}
        />
      );
      break;
    case "tag_aliases":
    case "tag_names":
      disablePullTrigger = false;
    case "tags":
    case "tag_groups":
      table = <TaggingTable type={type} {...genericEntryTableParams} />;
      break;
  }

  return (
    <div>
      <div className="flex flex-row justify-center space-x-0.5">
        <Button
          onClick={() => {
            setPullTrigger(pullTrigger + 1);
          }}
          disabled={disablePullTrigger}
        >
          <CloudDownload />
        </Button>
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

interface GenericEntryTableProps extends EntryTableProps {
  schema: TableInfo | DescriptorInfo;
  type: "data" | "descriptors";
}

interface TaggingEntryTableProps extends EntryTableProps {
  type: "tags" | "tag_names" | "tag_aliases" | "tag_groups";
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
  type,
}: GenericEntryTableProps): JSX.Element {
  const datasetSchema = useMemo(
    () =>
      getZodDatasetType(
        schema.schema,
        "tagging" in schema ? schema["tagging"] : false,
      ),
    [schema],
  );
  const [data, setData] = useState<Dataset>();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log(data);
  }, [data]);

  useEffect(() => {
    getData(
      `${endpoint}/${databaseName}/${tableName}/${type}`,
      setLoading,
      setData,
      datasetSchema,
    );
  }, [endpoint, refreshTrigger]);

  if (loading) return <p>Loading...</p>;

  if (!data) return <p>No data.</p>;

  return <DatasetTable dataset={data} />;
}

/**
 * TAGGING SUB-TABLES ONLY: Render an entry table full of data and a form at the bottom to insert new entries in.
 * @param databaseName The name of the database that contains the target table.
 * @param tableName The name of the parent table (or the target table if there is no parent).
 * @param endpoint The endpoint prefix to get data from. (i.e. DATABASE_URL or CACHE_URL/main)
 * @param refreshTrigger A controlled field to trigger a refresh through useEffect.
 * @param type The type of TaggingTable to render.
 * @returns
 */
function TaggingTable({
  databaseName,
  tableName,
  endpoint,
  refreshTrigger,
  type,
}: TaggingEntryTableProps) {
  const [data, setData] = useState<Dataset>();
  const [loading, setLoading] = useState<boolean>(true);

  const schema = useMemo(() => {
    switch (type) {
      case "tag_aliases":
        return TAGGING_TABLE_TAG_ALIASES_SCHEMA;
      case "tag_groups":
        return TAGGING_TABLE_TAG_GROUPS_SCHEMA;
      case "tag_names":
        return TAGGING_TABLE_TAG_NAMES_SCHEMA;
      case "tags":
        return TAGGING_TABLE_TAGS_SCHEMA;
    }
  }, [type]);

  const controller = useForm({
    resolver: zodResolver(schema),
  });

  function onSubmit(values: z.infer<typeof schema>) {
    submitEntry(
      `${CACHE_URL}/main/${toSnakeCase(databaseName)}/${toSnakeCase(tableName)}/${type}`,
      values,
      CACHE_CSRF_ENDPOINT,
    )
      .then(() => {
        // @TODO redirect, popup, etc.
      })
      .catch((reason) => {
        toast(`Form submission failed: ${reason}`);
        console.log(`Form submission failed: ${reason}`);
      });
  }

  function onSubmitInvalid(errors: FieldErrors<z.infer<typeof schema>>) {
    console.error("Invalid form submission.", errors);
    toast("Invalid form submission.");
  }

  const expectedLength = useMemo(() => {
    switch (type) {
      case "tag_aliases":
        return 2;
      case "tag_groups":
        return 3;
      case "tag_names":
        return 2;
      case "tags":
        return 3;
    }
  }, [type]);

  // load in data from
  useEffect(() => {
    getData(
      `${endpoint}/${databaseName}/${tableName}/${type}`,
      setLoading,
      setData,
      z.any(), // @TODO strict typing
    );
  }, [endpoint, refreshTrigger]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!data) return <p>No data</p>;

  if (data.columns.length != expectedLength) {
    return <p>Something went wrong!</p>;
  }

  const footer = (
    <TableFooter>
      <TableRow>
        {data.columns.map((columnName: string) => (
          <TableCell key={`entry-table-footer-${columnName}`}>
            <TaggingTableEntry controller={controller} name={columnName} />
          </TableCell>
        ))}
      </TableRow>
    </TableFooter>
  );

  return (
    <form onSubmit={controller.handleSubmit(onSubmit, onSubmitInvalid)}>
      <DatasetTable dataset={data} footer={footer}></DatasetTable>
      <Button className="w-full" type="submit">
        <Plus />
      </Button>
    </form>
  );
}

export default EntryTable;
