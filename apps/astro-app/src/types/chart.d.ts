import { Dispatch, SetStateAction } from "react";
import { type EChartsOption } from "echarts";
import type { FullDataset } from "./data";

export type ChartProps = {
  name: string;
};

export type GenericChartProps = {
  data: Any;
  options: DashboardComponentSchema;
};

export type EChartProps = {} & ChartProps;

export type GaugeChartProps = {
  //data
  value: number;

  // options
  min: number;
  max: number;
} & EChartProps;

export type WaterfallChartProps = {
  // data
  startValues: Array<number>; // the starting points of the values (i.e. bar offsets)
  values: Array<number>;
  labels: Array<string>;

  // options
  invertedAxes?: boolean; // defaults to false
  displayTotal?: boolean; // defaults to false
} & EChartProps;

export type TreeMapProps = {
  // data
  names: Array<string>;
  values: Array<number>;
  ancestries: Array<Array<string>>;

  // options
} & EChartProps;
