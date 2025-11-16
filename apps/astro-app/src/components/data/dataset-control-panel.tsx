import type { Dataset, TableInfo } from "@/env";
import type { JSX } from "astro/jsx-runtime";
import { useEffect, useState } from "react";
import { LineChartCard } from "@/components/data/data-card";
import config from "@universal_root/config.yml";
import { Button } from "@/components/ui/button";

type DatasetControlPanelProps = {
    databaseName: string;
    tableSchema: TableInfo;
};

export default function DatasetControlPanel({ databaseName, tableSchema }: DatasetControlPanelProps): JSX.Element {
    const [dataset, setDataset] = useState<Dataset>([]);
    const [columns, setColumns] = useState<Array<any>>([]);

    function fetchDataset() {
        fetch(`${config.referenceUrls.db}/${databaseName.toLowerCase()}/${tableSchema.tableName.toLowerCase()}?SELECT=*&ORDER_BY=ASC`).then((res) => {
            if (res.ok) {
                res.json().then((data) => {
                    // prettify column names
                    const dataColumns = data.columns.map((col: string) =>
                        col
                            .replace(/_/g, ' ')            // replace underscores with spaces
                            .replace(/\b\w/g, c => c.toUpperCase()) // capitalize each word
                    );
                    setColumns(dataColumns);
                    setDataset(data.data);
                }).catch((err) => {
                    console.error("Error parsing JSON:", err);
                });
            }
        }).catch((err) => {
            console.error("Error fetching data:", err);
        });
    }

    useEffect(() => fetchDataset(), []);

    return (
        <div>
            <Button className="w-full" onClick={fetchDataset}>Refresh Data</Button>
            <LineChartCard
                databaseName={databaseName}
                tableSchema={tableSchema}
                columns={columns}
                dataset={dataset}
            />
        </div>
    );
}