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
import { useState } from "react";
import type { EChartsOption } from "echarts";
import type { Dataset, TableInfo } from "@/env";
import { Label } from "@/components/ui/label";

export type ChartCardProps = {
    databaseName: string;
    tableSchema: TableInfo;
    columns: Array<any>;
    dataset: Dataset
};

function ChartSettings({ columns, x, setX, ys, setYs }: { columns: Array<any>, x: string, setX: (x: string) => void, ys: Array<string>, setYs: (ys: Array<string>) => void }) {
    const [open, setOpen] = useState(false);
    // const isDesktop = useMediaQuery("(min-width: 768px)");
    const isDesktop = true; // @TODO
    const [newX, setNewX] = useState<string>(x);
    const [newYs, setNewYs] = useState<Array<string>>(ys);

    function onSubmit() {
        setX(newX);
        setYs(newYs);
        setOpen(false);
    }

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={(x) => {
                setOpen(x);
                if (!x) {
                    onSubmit();
                }
            }}>
                <DialogTrigger asChild>
                    <Button variant="outline">Chart Settings</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Chart Settings</DialogTitle>
                        <DialogDescription>
                            ...
                        </DialogDescription>
                    </DialogHeader>

                    <Label>X axis:</Label>
                    <Select defaultValue={newX} onValueChange={(value) => {
                        setNewX(value);
                        setNewYs(newYs.filter((y) => y !== value));
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
                                disabled={col === newX}
                                checked={col !== newX && newYs.includes(col)}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        setNewYs([...newYs, col]);
                                    } else {
                                        setNewYs(newYs.filter((y) => y !== col));
                                    }
                                }}
                            />
                            <Label>{col}</Label>
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
    const [x, setX] = useState<string>(columns[0] || "");
    const [ys, setYs] = useState<Array<string>>([]);

    let options: EChartsOption = {
        dataset: {
            dimensions: columns,
            source: dataset
        },
        xAxis: {},
        yAxis: {},
        series: [{
            type: 'line',
            encode: {
                x: x,
                y: ys
            }
        }]
    };

    return (
        <Card className="">
            <CardHeader>
                <CardTitle>Line Chart</CardTitle>
                <CardDescription>
                    { }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartSettings columns={columns} x={x} setX={setX} ys={ys} setYs={setYs} />
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