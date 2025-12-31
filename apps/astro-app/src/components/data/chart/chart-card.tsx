import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { JSX } from "astro/jsx-runtime";
import { Button } from "@/components/ui/button";
import Chart from "@/components/chart";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { SeriesModel, type EChartsOption, type LineSeriesOption, type SeriesOption } from "echarts";
import type { Dataset, TableInfo } from "@/env";
import { Label } from "@/components/ui/label";
import { toSnakeCase } from "@root/src/utils";
import type { zodPrimaryDatatypes } from "@root/src/utils/data";

const prettySeriesTypes = [
    "Line",
]

type PrettySeriesType = typeof prettySeriesTypes[number]

const unprettySeriesTypes: Record<PrettySeriesType, "line"> = {
    "Line": "line",
}

const axisTypes: Record<zodPrimaryDatatypes, 'category' | 'value' | 'time' | 'log'> = {
    "integer": "value",
    "int": "value",
    "float": "value",
    "number": "value",
    "string": "category",
    "str": "category",
    "text": "category",
    "bool": "category",
    "boolean": "category",
    "time": "time",
    "date": "time",
    "timestamp": "time"
}

export type ChartCardProps = {
    databaseName: string;
    tableSchema: TableInfo;
    columns: Array<string>;
    dataset: Dataset
};


type ChartSettingsOption = Omit<EChartsOption, "series"> & {
    series: Array<Omit<LineSeriesOption, "encode"> & { encode: LineSeriesOption["encode"] }>;
}

/**
 * A generic/basic popover that allows a user to modify chart settings.
 * @param columns @type{string[]} The column names. This component will not load if there are no columns.
 * @param options The useState value for the chart options that this is controlling.
 * @param setOptions The useState setter for the chart options that this is controlling.
 * @returns @type{JSX.Element}
 */
function ChartSettings({ columns, tableSchema, options, setOptions }: { columns: Array<any>, tableSchema: TableInfo, options: ChartSettingsOption, setOptions: (options: ChartSettingsOption) => void }) {
    const [open, setOpen] = useState(false);
    const [newOptions, setNewOptions] = useState<ChartSettingsOption>(options);
    const [x, setX] = useState<string>(options.series.at(0)?.encode.x || columns[0] || "");
    const [seriesTypes, setSeriesTypes] = useState<Record<string, string>>({});

    // const isDesktop = useMediaQuery("(min-width: 768px)");
    const isDesktop = true; // @TODO

    function onSubmit() {
        setOptions(newOptions);
        setOpen(false);
    }

    useEffect(() => {
        if (columns) setSeriesTypes(Object.fromEntries(columns.map(col => [col, prettySeriesTypes[0]])));
    }, [columns]);

    if (!columns || columns.length == 0) {
        return (<div>Loading...</div>);
    }

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={(x) => {
                setOpen(x);
                if (x) {
                    setNewOptions(options);
                } else {
                    onSubmit();
                }
            }}>
                <DialogTrigger asChild>
                    <Button variant="outline">Chart Settings</Button>
                </DialogTrigger>
                <DialogContent className="max-h-screen overflow-y-scroll sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Chart Settings</DialogTitle>
                        <DialogDescription>
                            ...
                        </DialogDescription>
                    </DialogHeader>

                    <Label>X axis:</Label>
                    <Select defaultValue={x} onValueChange={(value) => {
                        let output = {
                            ...newOptions, series: newOptions.series.filter((series) => series.encode.y !== value)
                        };
                        if (!output.xAxis) {
                            output.xAxis = {};
                        }
                        output.xAxis.type = axisTypes[tableSchema.schema.find((item) => toSnakeCase(item.name) == toSnakeCase(value))?.datatype || "string"];
                        output.series.forEach(series => series.encode.x = value);
                        setX(value);
                        setNewOptions(output);
                    }
                    }>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select an X axis" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>X axis</SelectLabel>
                                {columns.map((col) => (
                                    <SelectItem key={col} value={col}>{col}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <Label>Y axis:</Label>
                    {columns.map((col) => (
                        <div key={col} className="flex items-center gap-3">
                            <Checkbox
                                disabled={col === x}
                                checked={col !== x && newOptions.series.some((series) => col == series.encode.y)}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        let newNewOptions: typeof newOptions = { ...newOptions };
                                        newNewOptions.series.push({
                                            type: unprettySeriesTypes[seriesTypes[col]],
                                            encode: {
                                                x: x,
                                                y: col
                                            }
                                        });

                                        setNewOptions(newNewOptions);
                                    } else {
                                        setNewOptions({ ...newOptions, series: newOptions.series.filter((series) => series.encode.y !== col) });
                                    }
                                }}
                            />
                            <Label>{col}</Label>
                            {/* @TODO see if this key is truly unique */}
                            <Select key={col + "-series-type-select"} defaultValue={prettySeriesTypes[0]} onValueChange={(val) => {
                                let newSeriesTypes = { ...seriesTypes };
                                for (let series of newOptions.series) {
                                    if (series.encode && series.encode.y == col) {
                                        // @TODO don't modify reference
                                        series.type = val;
                                        newSeriesTypes[col] = val;
                                    }
                                }

                                setSeriesTypes(newSeriesTypes);
                                setNewOptions(newOptions);
                            }}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Line" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Series Type</SelectLabel>
                                        {prettySeriesTypes.map((type) => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </DialogContent>
            </Dialog>
        )
    }

}

// START - Multi-variable Chart Cards

/**
 * A card component that displays a line chart with variables chosen by the user.
 * The user may choose to make the line step between values or connect data points directly.
 * The user may also choose to make this an area chart.
 * @returns {JSX.Element}
 */
export function LineChartCard({ databaseName, tableSchema, columns, dataset }: ChartCardProps): JSX.Element {
    const [options, setOptions] = useState<ChartSettingsOption>({
        dataset: {
            dimensions: columns,
            source: dataset
        },
        xAxis: {},
        yAxis: {},
        series: []
    });

    useEffect(() => {
        setOptions({
            dataset: {
                dimensions: columns,
                source: dataset
            },
            xAxis: {
                type: "time"
            },
            yAxis: {},
            series: []
        })
    }, [columns, dataset]);

    return (
        <Card className="">
            <CardHeader>
                <CardTitle>Line Chart</CardTitle>
                <CardDescription>
                    { }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartSettings columns={columns} tableSchema={tableSchema} options={options} setOptions={setOptions} />
                <Chart options={options} />
            </CardContent>
        </Card>
    );
}

/**
 * A card component that displays a line chart with variables chosen by the user.
 * The user may choose to make this a stacked line chart.
 * @returns {JSX.Element}
 */
export function StackedAreaChartCard(): JSX.Element {
    // @TODO
}

/**
 * A card component that displays a scatter plot with variables chosen by the user.
 * @returns {JSX.Element}
 */
export function ScatterPlotChartCard(): JSX.Element {
    // @TODO
}

// END - Multi-variable Chart Cards

// START - Single-variable Chart Cards

/**
 * A card component that displays a histogram with a variable chosen by the user.
 * The number of intervals may be adjusted by the user.
 * @returns {JSX.Element}
 */
export function HistogramChartCard(): JSX.Element {
    // @TODO
}

/**
 * A card component that displays a box plot with variables chosen by the user.
 * @returns {JSX.Element}
 */
export function BoxPlotChartCard(): JSX.Element {
    // @TODO
}

/**
 * A card component that displays a pie chart with a variable chosen by the user.
 * @returns {JSX.Element}
 */
export function PieChartCard(): JSX.Element {
    // @TODO
}

/**
 * A card component that displays a bar chart with a variable chosen by the user.
 * The user may choose to make this a horizontal or vertical bar chart.
 * The user also may choose to make this a stacked bar chart.
 * @returns {JSX.Element}
 */
export function BarChartCard(): JSX.Element {
    // @TODO
}
// END - Single-variable Chart Cards