"use client";

import type { DescriptorInfo, TableInfo, TableType } from "@/types/data";
import { type OriginName } from "@/types/http";
import { useDataset, useDescriptorDatasets } from "@utils/data/http";
import { useMemo, useState } from "react";
import { NumberBox } from "../input-element/number-box";
import { Button } from "@/components/ui/button";
import { OriginTypePicker } from "../origin-picker";
import { RefreshCcw } from "lucide-react";
import { Table, TableCell, TableRow } from "@/components/ui/table";

export function EntryViewer({
  schema,
  databaseName,
  tableName,
  descriptorName,
  type = "data",
}: {
  schema?: TableInfo | DescriptorInfo | undefined;
  databaseName: string;
  tableName: string;
  descriptorName?: string;
  type?: TableType;
}) {
  const [id, setId] = useState<number | null>(() => {
    return null;
    // if (window === undefined) return null;
    // const primaryKey = Number(
    //   new URLSearchParams(window.location.search).get("pkey"),
    // );
    // return isNaN(primaryKey) ? null : primaryKey;
  });
  const [origin, setOrigin] = useState<OriginName>("cache");
  const [tempID, setTempID] = useState<number | null>(null);
  const [dataRefreshState, setDataRefreshState] = useState(0);
  const [taggingDataRefreshState, setTaggingDataRefreshState] = useState(0);
  const [descriptorDataRefreshState, setDescriptorDataRefreshState] =
    useState(0);

  // START - SELECT query readiness
  // Whether or not the tagging table is ready to have data displayed (i.e. ready for a SELECT query)
  const dataTableReady = useMemo(() => {
    if (id === null) return false;

    return true;
  }, [id]);
  const taggingTableReady = useMemo(() => {
    if (id === null) return false;
    if (schema !== undefined && "tagging" in schema) return schema["tagging"];
    return false;
  }, [schema, id]);
  const descriptorTableReady = useMemo(() => {
    if (id === null) return false;
    if (schema === undefined) return false;

    return "descriptors" in schema;
  }, [schema, id]);
  // END - SELECT query readiness

  // START - load data
  const [data, dataLoading, dataError] = useDataset({
    valid: dataTableReady,
    table_type: type,
    schema: schema,
    source: origin,
    endpointOptions: {
      databaseName: databaseName,
      tableName: tableName,
    },
    refreshState: dataRefreshState,
  });
  const [taggingData, taggingDataLoading, taggingDataError] = useDataset({
    valid: dataTableReady,
    table_type: "tags",
    schema: undefined,
    source: origin,
    endpointOptions: {
      databaseName: databaseName,
      tableName: tableName,
    },
    refreshState: dataRefreshState,
  });
  const [descriptorData, descriptorDataLoading, descriptorDataError] =
    useDescriptorDatasets({
      valid: descriptorTableReady,
      table_type: type,
      schema: schema,
      source: origin,
      endpointOptions: {
        databaseName: databaseName,
        tableName: tableName,
        descriptorName: descriptorName,
      },
      refreshState: descriptorDataRefreshState,
    });
  // END - load data

  // START - data tables
  const dataTable = useMemo(() => {
    if (dataError) return <p>Error: {dataError}</p>;
    if (!dataTableReady) return null;
    if (dataLoading) return <p>Loading data...</p>;

    return null;
  }, [data, dataTableReady]);
  const taggingTable = useMemo(() => {
    if (!taggingTableReady) return null;
    if (taggingDataLoading) return <p>Loading data...</p>;
    if (taggingDataError || data === null)
      return (
        <>
          <p>Error: {dataError}</p>
          <Button
            type="button"
            onClick={() => {
              setDataRefreshState(dataRefreshState + 1);
            }}
          >
            <RefreshCcw />
          </Button>
        </>
      );

    return (
      <>
        <Table>
          {data.columns.map((columnName, index) => {
            return (
              <TableRow key={`data_table.${columnName}`}>
                <TableCell key={`data_table.${columnName}.column_name`}>
                  {columnName}
                </TableCell>
                <TableCell key={`data_table.${columnName}.value`}>
                  {data.data[0][index]}
                </TableCell>
              </TableRow>
            );
          })}
        </Table>
        <Button
          type="button"
          onClick={() => {
            setDataRefreshState(dataRefreshState + 1);
          }}
        >
          <RefreshCcw />
        </Button>
      </>
    );
  }, [taggingData, taggingTableReady]);
  const descriptorTable = useMemo(() => {
    if (!descriptorTableReady) return null;
    if (descriptorDataLoading) return <p>Loading data...</p>;

    return null;
  }, [descriptorData, descriptorTableReady]);

  // END - data tables

  /*
   * Select ID
   * Select Origin
   */
  const control = (
    <>
      <div>
        <NumberBox value={tempID} onChange={setTempID} />
        <Button
          type="button"
          onClick={() => {
            if (tempID !== null) setId(tempID);
          }}
        />
      </div>
      <div>
        <OriginTypePicker origin={origin} setOrigin={setOrigin} />
      </div>
    </>
  );

  if (id === null)
    return (
      <>
        {control}
        <p>Select an ID!</p>
      </>
    );

  return (
    <>
      {control}
      {/* entry data display */}
      {dataTable}
      {/* tagging data display */}
      {taggingTable}
      {/* descriptor data display */}
      {descriptorTable}
      {/* edit entry */}
    </>
  );
}
