import type { Datatype } from "./data";

export type DashboardComponentBaseSchema = {
  name: string;
  type: string;
  metrics: Array<string>;
  function?: string;
  "function args"?: Array<string>;
  selector?: string;
  "selector args"?: Array<string>;
};

export type GaugeChartSchema = {
  type: "Gauge Chart";
  min: number;
  max: number;
} & DashboardComponentBaseSchema;

export type WaterfallChartSchema = {
  type: "Waterfall Chart";
  offset?: string;
  datatype?: "value" | "category" | "time" | "log";
  invertAxes?: boolean;
} & DashboardComponentBaseSchema;

export type TreeMapSchema = {
  type: "Tree Map";
} & DashboardComponentBaseSchema;

export type DashboardComponentSchema = {
  name: string;
  type: string;
  metrics: Array<string>;
  function?: string;
  "function args"?: Array<string>;
  selector?: string;
  "selector args"?: Array<string>;
} & (GaugeChartSchema | WaterfallChartSchema | TreeMapSchema);
