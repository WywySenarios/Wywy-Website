import type { DatabaseInfo } from "@/types/data";
import type { DashboardComponentBaseSchema } from "@root/src/types/dashboard";
import { getZodDatasetType } from "@root/src/utils/data";
import { toSnakeCase } from "@utils/parse";
import { DATABASE_URL } from "astro:env/client";
import { useEffect, useMemo, useState, type JSX } from "react";
import { toast } from "sonner";

/**
 * Renders a dashboard based on the given database schema. Assumes there is a valid toaster to use.
 * @TODO configurable independent variable
 * @TODO configurable start function
 * @TODO descriptors
 * @TODO tags
 * @param databaseInfo The relevant database schema.
 */
export function Dashboard({
  databaseInfo,
}: {
  databaseInfo: DatabaseInfo;
}): JSX.Element {
  const [loadingDataState, setLoadingDataState] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<boolean>(false);
  const [refreshState, setRefreshState] = useState<number>(0);
  const [rawData, setRawData] = useState<
    Record<string, Record<"" | "", Array<any>>>
  >({});
  // metric data in vector form
  const [metrics, setMetrics] = useState<Record<string, Array<any>>>({});

  const dataSchema = useMemo(() => {
    let output: Record<string, any> = {};

    for (const tableInfo of databaseInfo.tables) {
      // table data
      output[tableInfo.tableName] = getZodDatasetType(tableInfo.schema);

      // descriptor data
      // for (const descriptorInfo of tableInfo.descriptors)
      //   output[`${tableInfo.tableName}_${descriptorInfo.name}_descriptors`] =
      //     getZodDatasetType(tableInfo.schema);
    }

    return output;
  }, [databaseInfo]);

  const databaseName: string = useMemo(() => {
    return toSnakeCase(databaseInfo.dbname);
  }, [databaseInfo]);

  useEffect(() => {
    // only allow one concurrent fetch
    if (loadingDataState) return;
    setLoadingDataState(true);

    let fetchPromises: Array<Promise<any>> = [];

    // fetch data from every table
    for (let tableInfo of databaseInfo.tables)
      fetchPromises.push(
        fetch(
          `${DATABASE_URL}/${databaseName}/${toSnakeCase(tableInfo.tableName)}?SELECT=*&ORDER_BY=ASC`,
          {
            method: "GET",
            mode: "cors",
            credentials: "include",
          },
        )
          .then((response: Response) => {
            if (!response.ok) {
              toast(
                `Failed to fetch data from table ${databaseName}/${toSnakeCase(tableInfo.tableName)}: Response is not OK: ${response.status} ${response.statusText}`,
              );
              return;
            }

            response
              .json()
              .then((body: any) => {
                let newRawData = {
                  ...rawData,
                };

                newRawData[`${toSnakeCase(tableInfo.tableName)}`] = body;
                setRawData(newRawData);
              })
              .catch((reason: any) => {
                toast(
                  `Failed to fetch data from table ${databaseName}/${toSnakeCase(tableInfo.tableName)}: ${reason}`,
                );
              });
          })
          .catch((reason: any) => {
            toast(
              `Failed to fetch data from table ${databaseName}/${toSnakeCase(tableInfo.tableName)}: ${reason}`,
            );
          }),
      );
    let fetchPromise = Promise.allSettled(fetchPromises);
    fetchPromise.then(() => {
      // attempt to validate schema
      // maybe this will guarentee failure because of hook call timing?
      const result = dataSchema.safeParse(rawData);
      setErrorState(result.success);

      if (!result.success) {
        toast(
          "Failed to fetch data: The server responded with invalid, incomplete, or anomalous data.",
        );
        console.error(result.error);
      }

      // compute metrics
      console.log(result);
      setMetrics({});
    });
    fetchPromise.catch(() => {
      setErrorState(true);
    });
    fetchPromise.finally(() => {
      setLoadingDataState(false);
    });
  }, [refreshState, databaseInfo]);

  return <div></div>;
}

function DashboardComponent({
  dashboardComponentSchema,
  loadingState,
  errorState,
  datasetMatrix,
  refreshState,
  setDatasetRefreshState,
}: {
  dashboardComponentSchema: DashboardComponentBaseSchema;
  loadingState: boolean;
  errorState: boolean;
  datasetMatrix: Array<Array<any>> | null;
  refreshState: number;
  setDatasetRefreshState: React.Dispatch<React.SetStateAction<number>>;
}): JSX.Element {
  // compile equations
  const selector = useMemo(() => {
    return null;
  }, [dashboardComponentSchema, refreshState]);
  const dataTransformation = useMemo(() => {
    return null;
  }, [dashboardComponentSchema, refreshState]);

  // @TODO optimize useMemo on selector & dataTransformation recompilation
  // compute selection
  const selectedData = useMemo(() => {
    if (datasetMatrix === null) return null;
  }, [selector, datasetMatrix]);

  // compute data transformation
  const data = useMemo(() => {
    if (selectedData === null) return null;
  }, [dataTransformation, selectedData]);

  // if the parent component has an error or an equation failed to compile,
  if (errorState || !selector || !dataTransformation) return <div>Error.</div>;

  if (loadingState) return <div>Loading...</div>;

  if (!data) {
    // no data state
    return <div>No data.</div>;
  }

  return <div></div>;
}
