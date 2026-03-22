import type {
  DatabaseInfo,
  DataColumn,
  Dataset,
  VectorDataset,
} from "@/types/data";
import type { DashboardComponentBaseSchema } from "@/types/dashboard";
import { getZodDatasetType } from "@/utils/data";
import { toSnakeCase } from "@utils/parse";
import { DATABASE_URL } from "astro:env/client";
import React, { useEffect, useMemo, useState, type JSX } from "react";
import { toast } from "sonner";
import { MATH } from "@/utils/math";

/**
 * Attempts to fetch a dataset. The URL to GET from is "[endpoint]/[target]?querystring"
 * @param endpoint
 * @param target
 * @param querystring
 * @param columnsSchema The columnsSchema to validate the vector dataset.
 * @returns A promise that will resolve when the dataset is fetched and re-shaped into a vector dataset.
 */
function fetchDataset(
  endpoint: string,
  target: string,
  querystring: string,
  columnsSchema: Array<DataColumn>,
  tagging: boolean = false,
): Promise<VectorDataset> {
  return new Promise((resolve, reject) => {
    fetch(`${endpoint}/${target}?${querystring}`, {
      method: "GET",
      mode: "cors",
      credentials: "include",
    })
      .then((response: Response) => {
        if (!response.ok) {
          toast(
            `Failed to fetch data from table ${target}: Server responded with status ${response.status} ${response.statusText}, not OK.`,
          );
          reject("Response not OK.");
          return;
        }

        response
          .json()
          .then((body: Dataset) => {
            const rawDataSchema = getZodDatasetType(columnsSchema, tagging);
            const result = rawDataSchema.safeParse(body);
            if (!result.success) {
              toast(
                `Failed to fetch data from table ${target}: ${result.error}`, // @TODO prettify
              );
              reject(result.error);
              return;
            }

            if (!result.data) {
              // if Zod's behaviour is unexpected,
              toast(
                `Failed to fetch data from table ${target}: undefined data. Please report this error to the dev.`,
              );
              reject(
                "Undefined data? Contact website administrator or dev for a fix.",
              );
              return;
            } else {
              const data = result.data;

              // vectorize the data
              let output: VectorDataset = {};
              data.columns.map((columnName, i) => {
                output[columnName] = data.data.map((row) => {
                  return row[i];
                });
              });
              resolve(output);
            }
          })
          .catch((reason: any) => {
            toast(`JSON de-serialization failed: ${reason}`);
            reject(reason);
          });
      })
      .catch((reason: any) => {
        toast(`Fetch failed: ${reason}`);
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
  const [rawData, setRawData] = useState<Record<string, VectorDataset>>({});
  // metric data in vector form
  const [metrics, setMetrics] = useState<Record<string, Array<any>>>({});
  const [metricsReady, setMetricsReady] = useState<boolean>(false);

  // global variables for metric parsing, data selection, data transformations, etc.
  const globalVars: Record<string, any> = useMemo(
    () => ({
      now: new Date(),
    }),
    [refreshState],
  );

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
          tableInfo.schema,
          tableInfo.tagging ? true : false,
        ).then((value: VectorDataset) => {
          rawData[`${toSnakeCase(tableInfo.tableName)}`] = value;
        }),
      );
    let fetchPromise = Promise.allSettled(fetchPromises);
    fetchPromise.then((results) => {
      setErrorState(results.some((result) => result.status === "rejected"));
    });
    fetchPromise.finally(() => {
      setRawData({ ...rawData });
      setLoadingDataState(false);
    });
  }, [refreshState, databaseInfo]);

  useEffect(() => {
    if (loadingDataState) return;
    if (errorState) return;
    if (Object.keys(rawData).length == 0) return; // useEffect calls once on page load. This ignores that initial call.

    // compute metrics
    let newMetrics: VectorDataset = {};
    // recompute global variables (i.e. runtime constants)
    for (let tableInfo of databaseInfo.tables) {
      const equationParser = MATH.parser();
      // prepare global variables
      for (const varName in globalVars) {
        equationParser.set(varName, globalVars[varName]);
      }

      // load data
      // @TODO prevent name collision
      const tableData: VectorDataset =
        rawData[toSnakeCase(tableInfo.tableName)];
      for (const vectorName in tableData) {
        equationParser.set(vectorName, tableData[vectorName]);
      }

      for (let metricSchema of tableInfo.metrics) {
        // evaluate metric
        if (!metricSchema.function) {
          // skip metric transformation if the function is the identity function
          if (metricSchema.data.length == 1)
            newMetrics[toSnakeCase(metricSchema.name)] =
              tableData[toSnakeCase(metricSchema.data[0])];
          else
            throw TypeError(
              "The identity transformation for metrics may only have one vector input.",
            );
          continue;
        }

        newMetrics[toSnakeCase(metricSchema.name)] = equationParser.evaluate(
          // thank goodness snake case conversion doesn't target commas!
          `${toSnakeCase(metricSchema.function)}(${toSnakeCase(metricSchema.data.join(","))})`,
        );
      }
    }
    setMetrics(newMetrics);
    setMetricsReady(true);
  }, [loadingDataState, rawData]);

  useEffect(() => {
    if (loadingDataState) setMetricsReady(false);
  }, [loadingDataState]);

  if (!databaseInfo.dashboard) {
    return <div>No dashboard available.</div>;
  }

  return (
    <div>
      {databaseInfo.dashboard.map(
        (dashboardComponentSchema: DashboardComponentBaseSchema) => (
          <DashboardComponent
            dashboardComponentSchema={dashboardComponentSchema}
            loadingState={loadingDataState}
            errorState={errorState}
            metricsReady={metricsReady}
            globalVars={globalVars}
            datasetMatrix={dashboardComponentSchema.metrics.map(
              (metricName: string) => metrics[toSnakeCase(metricName)],
            )}
            refreshState={refreshState}
            setDatasetRefreshState={setRefreshState}
            key={dashboardComponentSchema.name}
          />
        ),
      )}
    </div>
  );
}

function DashboardComponent({
  dashboardComponentSchema,
  loadingState,
  errorState,
  metricsReady,
  globalVars,
  datasetMatrix,
  refreshState,
  setDatasetRefreshState,
}: {
  dashboardComponentSchema: DashboardComponentBaseSchema;
  loadingState: boolean;
  errorState: boolean;
  metricsReady: boolean;
  globalVars: Record<string, any>;
  datasetMatrix: Array<Array<any>> | null;
  refreshState: number;
  setDatasetRefreshState: React.Dispatch<React.SetStateAction<number>>;
}): JSX.Element {
  // set up equation environment
  const equationParser = useMemo(() => {
    const output = MATH.parser();
    for (const varName in globalVars) {
      output.set(varName, globalVars[varName]);
    }
    return output;
  }, [globalVars]);

  // @TODO optimize useMemo on selector & dataTransformation recompilation
  // compute selection
  const selectedData = useMemo(() => {
    if (!datasetMatrix) return null;
    if (loadingState) return null;
    if (errorState) return null;
    if (!metricsReady) return null;

    if (!dashboardComponentSchema.selector) {
      return datasetMatrix;
    }

    equationParser.set("datasetMatrix", datasetMatrix);

    return equationParser.evaluate(
      `${toSnakeCase(dashboardComponentSchema.selector)}(${[...(dashboardComponentSchema["selector args"] ?? []), "datasetMatrix"].join(",")})`,
    );
  }, [datasetMatrix]);

  // compute data transformation
  const data = useMemo(() => {
    if (!selectedData) return null;
  }, [selectedData]);

  // if the parent component has an error or an equation failed to compile,
  if (errorState) return <div>Error.</div>;

  if (loadingState) return <div>Loading...</div>;

  if (!data) {
    // no data state
    return <div>No data.</div>;
  }

  return <div></div>;
}
