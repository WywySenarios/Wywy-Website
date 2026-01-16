"use client"

import { TrendingUp, Variable } from "lucide-react"
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type ChartConfig, ChartContainer } from "@/components/ui/chart"
// import { type CollectionEntry } from "astro:content";

interface RadialChartsProps {
  // fullInfo: CollectionEntry<"datasets">;
  info: any;
  x: string;
}
let chartData = [
  { type: "safari", visitors: 200, fill: "#fcba03" },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  safari: {
    label: "Safari",
    color: "#fcba03",
  },
} satisfies ChartConfig

export function RadialCharts({ info, x }: RadialChartsProps) {
  // const info = fullInfo.data;

  const children = info.buckets.map((bucket: string) => {
    return <RadialChart x={x} datum={info.data} title={bucket} key={bucket} />;
  });

  // console.log(children);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Title</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4 pb-0">
          {
            info.buckets.map((bucket: string) => {
              return <RadialChart x={x} datum={info.data} title={bucket} key={bucket}/>;
            })
          }
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}

interface RadialChartProps {
  x: any | undefined;
  datum: any | undefined;
  title: any | undefined;
}

const RadialChart = ({ x, datum, title }: RadialChartProps) => {
  return (

    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-w-[250px] min-w-[15vw]"
    >
      <RadialBarChart
        data={chartData}
        startAngle={0}
        endAngle={250}
        innerRadius={80}
        outerRadius={110}
      >
        <PolarGrid
          gridType="circle"
          radialLines={false}
          stroke="none"
          className="first:fill-muted last:fill-background"
          polarRadius={[86, 74]}
        />
        <RadialBar dataKey="visitors" background cornerRadius={10} />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-4xl font-bold"
                    >
                      {chartData[0].visitors.toLocaleString()}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground"
                    >
                      Visitors
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </PolarRadiusAxis>
      </RadialBarChart>
    </ChartContainer>
  );
}