"use client";

import type { DescriptorInfo, TableInfo, TableType } from "@/types/data";
import { type OriginName } from "@/types/http";
import { useDataset, useDescriptorDatasets } from "@utils/data/http";
import { useMemo, useState } from "react";
import { NumberBox } from "../input-element/number-box";
import { Button } from "@/components/ui/button";
import { OriginTypePicker } from "../origin-picker";
import { Check, RefreshCcw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toSnakeCase } from "@utils/parse";
import { DatasetTable } from "./entry-table";

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
      databaseName: toSnakeCase(databaseName),
      tableName: toSnakeCase(tableName),
    },
    refreshState: dataRefreshState,
    options: {
      id: id,
    },
  });
  const [taggingData, taggingDataLoading, taggingDataError] = useDataset({
    valid: dataTableReady,
    table_type: "tags",
    schema: undefined,
    source: origin,
    endpointOptions: {
      databaseName: toSnakeCase(databaseName),
      tableName: toSnakeCase(tableName),
      tableType: "tags",
    },
    refreshState: dataRefreshState,
    options: {
      parent_id: id,
    },
  });
  const [descriptorData, descriptorDataLoading, descriptorDataError] =
    useDescriptorDatasets({
      valid: descriptorTableReady,
      table_type: type,
      schema: schema,
      source: origin,
      endpointOptions: {
        databaseName: toSnakeCase(databaseName),
        tableName: toSnakeCase(tableName),
      },
      refreshState: descriptorDataRefreshState,
      options: {
        parent_id: id,
      },
    });
  // END - load data

  // START - data tables
  const dataTable = useMemo(() => {
    if (!dataTableReady) return null;
    if (dataLoading) return <p>Loading data...</p>;
    if (dataError || data === null)
      return <p>An error occured while loading data. {String(dataError)}</p>;

    return (
      <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Column Name</TableCell>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.columns.map((columnName, index) => {
              return (
                <TableRow key={`data_table.${columnName}`}>
                  <TableCell key={`data_table.${columnName}.column_name`}>
                    {columnName}
                  </TableCell>
                  <TableCell key={`data_table.${columnName}.value`}>
                    {String(data.data[0][index])}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
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
  }, [data, dataTableReady, dataLoading, dataError]);
  const taggingTable = useMemo(() => {
    if (!taggingTableReady) return null;
    if (taggingDataLoading) return <p>Loading data...</p>;
    if (taggingDataError || taggingData === null)
      return (
        <>
          <p>An error occured while loading data. {String(taggingDataError)}</p>
          <Button
            type="button"
            onClick={() => {
              setTaggingDataRefreshState(taggingDataRefreshState + 1);
            }}
          >
            <RefreshCcw />
          </Button>
        </>
      );

    return (
      <>
        <DatasetTable dataset={taggingData} explorePath="" />
        <Button
          type="button"
          onClick={() => {
            setTaggingDataRefreshState(taggingDataRefreshState + 1);
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
    if (descriptorDataError || descriptorData === null) {
      return (
        <>
          <p>
            An error occured while loading data. {String(descriptorDataError)}
          </p>
          <Button
            type="button"
            onClick={() => {
              setDescriptorDataRefreshState(descriptorDataRefreshState + 1);
            }}
          >
            <RefreshCcw />
          </Button>
        </>
      );
    }

    const descriptorTables = [];
    for (const descriptorName in descriptorData) {
      descriptorTables.push(
        <DatasetTable
          dataset={descriptorData[descriptorName]}
          explorePath=""
        />,
      );
    }
    console.log(descriptorDataError);

    return (
      <>
        {descriptorTables.map((table) => table)}
        <Button
          type="button"
          onClick={() => {
            setDescriptorDataRefreshState(descriptorDataRefreshState + 1);
          }}
        >
          <RefreshCcw />
        </Button>
      </>
    );
  }, [descriptorData, descriptorTableReady]);

  // END - data tables

  /*
   * Select ID
   * Select Origin
   */
  const control = (
    <div className="flex flex-col justify-center gap-2">
      <div className="flex flex-row gap-2 items-center">
        <p>ID: </p>
        <NumberBox
          value={tempID}
          onChange={setTempID}
          placeholder="Select an ID."
        />
        <Button
          type="button"
          onClick={() => {
            if (tempID !== null) setId(tempID);
          }}
        >
          <Check />
        </Button>
      </div>
      <div className="flex flex-row justify-center">
        <OriginTypePicker origin={origin} setOrigin={setOrigin} />
      </div>
    </div>
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
