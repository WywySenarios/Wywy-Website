import type { DatabaseInfo } from "@/types/data";
import type { DashboardComponentBaseSchema } from "@root/src/types/dashboard";
import { getZodDatasetType } from "@root/src/utils/data";
import { toSnakeCase } from "@utils/parse";
import { DATABASE_URL } from "astro:env/client";
import React, { useEffect, useMemo, useState, type JSX } from "react";
import { toast } from "sonner";

function fetchDataset(
  endpoint: string,
  target: string,
  querystring: string,
): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    fetch(`${endpoint}/${target}?${querystring}`, {
      method: "GET",
      mode: "cors",
      credentials: "include",
    })
      .then((response: Response) => {
        if (!response.ok) {
          reject("Response not OK.");
          return;
        }

        response
          .json()
          .then((body: any) => {
            resolve(body);
          })
          .catch((reason: any) => {
            reject(reason);
          });
      })
      .catch((reason: any) => {
        reject(reason);
      });
  });
}

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
        fetchDataset(
          DATABASE_URL,
          `${databaseName}/${toSnakeCase(tableInfo.tableName)}`,
          "SELECT=*&ORDER_BY=ASC",
        )
          .then((value: Record<string, any>) => {
            rawData[`${toSnakeCase(tableInfo.tableName)}`] = value;

            let newRawData = {
              ...rawData,
            };

            setRawData(newRawData);
          })
          .catch((reason: any) => {
            toast(
              `Failed to fetch data from table ${tableInfo.tableName}: ${reason}`,
            );
          }),
      );
    let fetchPromise = Promise.allSettled(fetchPromises);
    fetchPromise.then(() => {});
    fetchPromise.catch(() => {
      setErrorState(true);
    });
    fetchPromise.finally(() => {
      setLoadingDataState(false);
    });
  }, [refreshState, databaseInfo]);

  useEffect(() => {
    if (loadingDataState) return;
    if (errorState) return;

    // attempt to validate schema
    let newErrorState = false; // innocent until proven guilty
    let safeData: Record<string, unknown> = {};
    for (const key in rawData) {
      const currentResult = dataSchema[key].safeParse(rawData[key]);
      if (currentResult.success) {
        safeData[key] = currentResult.data;
      } else {
        newErrorState = true;
        toast(
          "Failed to fetch data: The server responded with invalid, incomplete, or anomalous data.",
        );
        console.error(currentResult.error);
        setErrorState(true);
      }
    }

    // compute metrics
    setMetrics({});
  }, [loadingDataState]);

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
