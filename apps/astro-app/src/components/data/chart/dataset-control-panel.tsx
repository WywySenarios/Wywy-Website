import type { Dataset, TableInfo } from "@/env";
import type { JSX } from "astro/jsx-runtime";
import { useEffect, useState } from "react";
import { LineChartCard } from "@/components/data/chart/chart-card";
import config from "@universal_root/config.yml";
import { Button } from "@/components/ui/button";
import {
  prettyParseString,
  prettyParseInt,
  prettyParseFloat,
  prettyParseBoolean,
  prettyParseTime,
  prettyParseDate,
  prettyParseTimestamp,
  prettifySnakeCase,
} from "@/utils";

type DatasetControlPanelProps = {
  databaseName: string;
  tableSchema: TableInfo;
};

const prettyParseFunctions = {
  string: prettyParseString,
  str: prettyParseString,
  text: prettyParseString,
  int: prettyParseInt,
  integer: prettyParseInt,
  float: prettyParseFloat,
  number: prettyParseFloat,
  bool: prettyParseBoolean,
  boolean: prettyParseBoolean,
  date: (value: string) => prettyParseDate(value), //?.toDateString().slice(4),
  time: (value: string) => prettyParseTime(value), //?.toTimeString(),
  timestamp: (value: string) => prettyParseTimestamp(value), //?.toString(),
};

export default function DatasetControlPanel({
  databaseName,
  tableSchema,
}: DatasetControlPanelProps): JSX.Element {
  const [dataset, setDataset] = useState<Dataset>([]);
  const [columns, setColumns] = useState<Array<any>>([]);

  function fetchDataset() {
    fetch(
      `${config.referenceUrls.db}/${databaseName.toLowerCase()}/${tableSchema.tableName.toLowerCase()}?SELECT=*&ORDER_BY=ASC`,
      {
        method: "GET",
        mode: "cors",
        credentials: "include",
      }
    )
      .then((res) => {
        if (res.ok) {
          res
            .json()
            .then((data) => {
              console.log(data);

              // prettify column names
              const dataColumns = data.columns.map((col: string) =>
                prettifySnakeCase(col)
              );

              // parse every column
              let dataset = data.data;

              // parse dataset (convert to correct datatype)
              // @TODO do not assume schemas will match?
              let i = 0;
              for (const dataColumn of tableSchema.schema) {
                let prettifier =
                  prettyParseFunctions[
                    dataColumn.parser ? dataColumn.parser : dataColumn.datatype
                  ];
                for (const row of dataset) {
                  row[i] = prettifier(row[i]);
                }
                i++;

                // check for comments column
                if (dataColumn.comments) {
                  for (const row of dataset) {
                    row[i] = prettyParseString(row[i]);
                  }
                  i++;
                }
              }

              setColumns(dataColumns);
              setDataset(dataset);
            })
            .catch((err) => {
              console.error("Error parsing JSON:", err);
            });
        }
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
      });
  }

  useEffect(() => fetchDataset(), []);

  return (
    <div>
      <Button className="w-full" onClick={fetchDataset}>
        Refresh Data
      </Button>
      <LineChartCard
        databaseName={databaseName}
        tableSchema={tableSchema}
        columns={columns}
        dataset={dataset}
      />
    </div>
  );
}
