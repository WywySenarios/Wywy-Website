"use client";

import type { DescriptorInfo, TableInfo, TableType } from "@/types/data";
import { type OriginName } from "@/types/http";
import { useDataset, useDescriptorDatasets } from "@utils/data/http";
import { useEffect, useMemo, useState, type Dispatch } from "react";
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
import type { JSX } from "astro/jsx-runtime";
import { resolveEndpoint } from "@utils/data/endpoints";

function EntryViewerError({ message }: { message: string }) {
  return (
    <>
      <p>An error occured while loading data. {message}</p>
    </>
  );
}

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
    if (window == undefined) return null;
    const primaryKey = Number(
      new URLSearchParams(window.location.search).get("pkey"),
    );
    return isNaN(primaryKey) ? null : primaryKey;
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

  // automatically update table data when the ID changes
  useEffect(() => {
    if (id === null) return; // updates are not useful when the ID is null.

    setDataRefreshState(dataRefreshState + 1);
    setTaggingDataRefreshState(taggingDataRefreshState + 1);
    setDescriptorDataRefreshState(descriptorDataRefreshState + 1);
  }, [id]);

  // START - load data
  const [data, dataLoading, dataError] = useDataset({
    valid: dataTableReady,
    table_type: type,
    schema: schema,
    source: origin,
    endpointOptions: {
      databaseName: toSnakeCase(databaseName),
      tableName: toSnakeCase(tableName),
      tableType: type,
      descriptorName:
        schema !== undefined && "name" in schema
          ? toSnakeCase(schema.name)
          : undefined,
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
    refreshState: taggingDataRefreshState,
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
    let body: JSX.Element | null;
    if (dataLoading) body = <p>Loading data...</p>;
    else if (dataError) body = <EntryViewerError message={String(dataError)} />;
    else if (data === null || data.data.length == 0)
      body = <EntryViewerError message="No data." />;
    else if (data.data.length != 1)
      body = <EntryViewerError message="Unexpected number of rows found." />;
    else
      body = (
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
      );

    return (
      <div className="flex flex-col justify-center">
        <h1>Entry Data</h1>
        {body}
        <Button
          type="button"
          onClick={() => {
            setDataRefreshState(dataRefreshState + 1);
          }}
        >
          <RefreshCcw />
        </Button>
      </div>
    );
  }, [data, dataTableReady, dataLoading, dataError]);
  const taggingTable = useMemo(() => {
    if (!taggingTableReady) return null;
    let body: JSX.Element | null;
    if (taggingDataLoading) body = <p>Loading data...</p>;
    else if (taggingDataError)
      body = <EntryViewerError message={String(taggingDataError)} />;
    else if (taggingData === null)
      return <EntryViewerError message="No data." />;
    else
      body = (
        <DatasetTable
          dataset={taggingData}
          explorePath={`/data/${databaseName}/${tableName}/explore/tags`}
          readonly={false}
        />
      );

    return (
      <div className="flex flex-col justify-items-center">
        <h1>Secondary Tags</h1>
        {body}
        <Button
          type="button"
          onClick={() => {
            setTaggingDataRefreshState(taggingDataRefreshState + 1);
          }}
        >
          <RefreshCcw />
        </Button>
      </div>
    );
  }, [taggingData, taggingTableReady, taggingDataLoading, taggingDataError]);
  const descriptorTable = useMemo(() => {
    if (!descriptorTableReady) return null;
    let body: JSX.Element | null;
    if (descriptorDataLoading) body = <p>Loading data...</p>;
    else if (descriptorDataError)
      body = <EntryViewerError message={String(descriptorDataError)} />;
    else if (descriptorData === null)
      body = <EntryViewerError message="No data." />;
    else {
      const descriptorTables = [];
      for (const descriptorName in descriptorData) {
        descriptorTables.push(
          <DatasetTable
            dataset={descriptorData[descriptorName]}
            explorePath=""
          />,
        );
      }
      body = descriptorTables.map((table) => table);
    }

    return (
      <div className="flex flex-col justify-items-center">
        <h1>Descriptors</h1>
        {body}
        <Button
          type="button"
          onClick={() => {
            setDescriptorDataRefreshState(descriptorDataRefreshState + 1);
          }}
        >
          <RefreshCcw />
        </Button>
      </div>
    );
  }, [
    descriptorData,
    descriptorTableReady,
    descriptorDataLoading,
    descriptorDataError,
  ]);

  // END - data tables

  /*
   * Select ID
   * Select Origin
   */
  const control = (
    <div className="flex flex-col justify-center gap-2">
      <div className="flex flex-row gap-2 items-center">
        <p className="whitespace-nowrap">ID: {id ?? ""}</p>
        <NumberBox
          value={tempID}
          onChange={setTempID}
          placeholder="Select a new ID."
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
    <div className="flex flex-col justify-center gap-5">
      {control}
      {/* entry data display */}
      {dataTable}
      {/* tagging data display */}
      {taggingTable}
      {/* descriptor data display */}
      {descriptorTable}
      {/* edit entry */}
    </div>
  );
}
