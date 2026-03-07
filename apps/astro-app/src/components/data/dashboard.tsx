import type { DatabaseInfo } from "@/types/data";
import type { DashboardComponentBaseSchema } from "@root/src/types/dashboard";
import { useEffect, useMemo, useState, type JSX } from "react";

/**
 * Renders a dashboard based on the given database schema.
 * @param databaseInfo The relevant database schema.
 */
export function Dashboard({
  databaseInfo,
}: {
  databaseInfo: DatabaseInfo;
}): JSX.Element {
  // @TODO configurable independent variable
  // @TODO configurable start function
  const [loadingDataState, setLoadingDataState] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<boolean>(false);
  const [refreshState, setRefreshState] = useState<number>(0);
  // metric data in vector form
  const [metrics, setMetrics] = useState<Record<string, Array<any>>>({});

  // const noDataState: boolean = Object.keys(metrics).length === 0;

  // initial data fetch & data fetch handler
  useEffect(() => {
    // only allow one concurrent fetch
    if (loadingDataState) return;

    // fetch data from every table
    // compute metrics
    setMetrics({});

    setLoadingDataState(false);
  }, [refreshState]);

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
