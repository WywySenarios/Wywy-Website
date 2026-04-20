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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getZodDatasetType } from "@utils/data/schema";
import { safeFetchDataset } from "@utils/data/http";
import { ZodError, type ZodType } from "zod";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { EntryTableProps } from "./entry-table-page";

/**
 * Fetches the data from the endpoint and assumes the data to be of the specified type.
 * @param URL Endpoint/source URL
 * @param setLoading The function to set the loading state of the caller.
 * @param setData The function to set the data of the caller.
 * @param schema Zod schema to validate against.
 */
export function getData<T extends Dataset>(
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
      if (reason instanceof ZodError) {
        console.error(reason.issues);
      } else {
        console.error(reason);
      }
      setData(undefined);
    })
    .finally(() => {
      setLoading(false);
    });
}

/**
 * Renders a table to display a dataset.
 * @param dataset The dataset to display.
 * @param footer The footer to display. This is important for the band-aid version of tagging tables.
 * @param readonly Whether or not table cells should be text-only.
 * @param explorePath The base path for the explore section of the respective dataset. This allows the user to navigate to an area to look a given entry individually.
 * @returns
 */
export function DatasetTable({
  dataset,
  footer = null,
  subcolumnVisibility = true,
  readonly = true,
  explorePath,
}: {
  dataset: Dataset;
  footer?: null | ReactNode;
  subcolumnVisibility?: boolean;
  readonly?: boolean;
  explorePath: string;
}) {
  const indexesToDisplay = useMemo(() => {
    const output: Array<number> = [];
    dataset.columns.map((columnName, index) => {
      if (index == 0) return; // special treatment for ID column
      if (!subcolumnVisibility) {
        if (columnName.endsWith("_comments")) return;
        if (columnName.endsWith("_latlong_accuracy")) return;
        if (columnName.endsWith("_altitude")) return;
        if (columnName.endsWith("_altitude_accuracy")) return;
      }
      output.push(index);
    });
    return output;
  }, []);

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
                {/* Primary key */}
                {readonly ? (
                  String(row[0])
                ) : (
                  <a href={`${explorePath}?pkey=${row[0]}`}>{String(row[0])}</a>
                )}
                {/* Other data */}
                {indexesToDisplay.map((indexToDisplay: number) => (
                  <TableCell
                    key={`entry-table-cell-${indexToDisplay}-${entryIndex}`}
                  >
                    {String(row[indexToDisplay])}
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

interface GenericEntryTableProps extends EntryTableProps {
  schema: TableInfo | DescriptorInfo;
  type: "data" | "descriptors";
}

/**
 * A generic entry editor table.
 * @param schema The table schema.
 * @param databaseName The name of the database that contains the target table.
 * @param tableName The name of the parent table (or the target table if there is no parent).
 * @param endpoint The endpoint prefix to get data from. (i.e. DATABASE_URL or CACHE_URL/main)
 * @param refreshTrigger A controlled field to trigger a refresh through useEffect.
 * @param type The table type to fetch.
 * @returns
 */
export function GenericEntryTable({
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
