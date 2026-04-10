import { DashboardComponentBaseSchema } from "dashboard";

// START - Schema
export interface DatabaseInfo {
  dbname: string;
  tables: Array<TableInfo>;
  dashboard?: Array<DashboardComponentBaseSchema>;
}

export interface MetricSchema {
  name: string;
  datatype?: Datatype;
  function?: string;
  data: Array<string>;
  args?: Array<string>;
}

export interface DescriptorInfo {
  name: string;
  schema: Array<DataColumn>;
  metrics: Array<MetricSchema>;
}

export interface TableInfo {
  tableName: string;
  entrytype: "form" | "timer";
  read: boolean;
  write: boolean;
  comments: boolean;
  tagging: boolean;
  schema: Array<DataColumn>;
  metrics: Array<MetricSchema>;
  descriptors: Array<DescriptorInfo>;
}

// internally (Wywy-Website-Master-Database) recognized datatypes.
export type Datatype =
  | "int"
  | "integer"
  | "float"
  | "number"
  | "string"
  | "str"
  | "text"
  | "bool"
  | "boolean"
  | "date"
  | "time"
  | "timestamp"
  | "enum"
  | "geodetic point";

export type ResolvedDatatype =
  | "int"
  | "number"
  | "str"
  | "bool"
  | "date"
  | "time"
  | "timestamp"
  | "enum"
  | "geodetic point";

export interface GeodeticCoordinates {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
}

// look at the restrictions for different entry types
// @TODO find out if it's possible to restrict  the value of defaultValue before runtime
type NoRestrictions = {
  entrytype: "none";
};

type SliderRestrictions = {
  entrytype: "linearSlider";
  min?: number;
  max?: number;
};

type RadioRestrictions = {
  entrytype: "radio";
  values: [string, ...string[]];
};

type SwitchRestrictions = {
  entrytype: "switch";
};

type DateRestrictions = {
  entrytype: "calendar";
  //min?: Date,
  //max?: Date,
};

type TimeRestrictions = {
  entrytype: "time";
};

type TimestampRestrictions = {
  entrytype: "calendar time";
};

type SelectRestrictions = {
  entrytype: "select" | "search-select";
  values: [string, ...string[]];
  labels?: Array<string>;
};

// look at different datatypes
type IntegerColumn = {
  datatype: "int" | "integer";
  defaultValue?: number;
} & (SliderRestrictions | RadioRestrictions | NoRestrictions);

type FloatColumn = {
  datatype: "float" | "number";
  defaultValue?: number;
} & (SliderRestrictions | RadioRestrictions | NoRestrictions);

type StringColumn = {
  datatype: "string" | "str" | "text";
  entrytype: "textbox" | "none";
  defaultValue?: string;
};

type BooleanColumn = {
  datatype: "bool" | "boolean";
  defaultValue?: boolean;
} & (RadioRestrictions | SwitchRestrictions | NoRestrictions);

type DateColumn = {
  datatype: "date";
  defaultValue?: string; // @TODO consider switching datatypes?
} & (DateRestrictions | NoRestrictions);

type TimeColumn = {
  datatype: "time";
  entrytype: "time" | "none";
  defaultValue?: string; // @TODO consider switching datatypes?
};

type TimestampColumn = {
  datatype: "timestamp";
  entrytype: "calendar time" | "none";
  defaultValue?: string; // @TODO consider switching datatypes?
};

type EnumColumn = {
  datatype: "enum";
  values: [string, ...string[]];
  defaultValue: string; // @TODO ensure defaultValue is within values
} & (SelectRestrictions | NoRestrictions);

type GeodeticPointColumn = {
  datatype: "geodetic point";
  defaultValue: string;
  entrytype: "geodetic point" | "geodetic point minimal" | "none";
};

export type DataColumn = {
  name: string;
  parser?: Datatype;
  datatype: Datatype;
  invalidInputMessage?: string;
  comments?: boolean;
  description?: string;
  unique?: boolean;
  record_on?: "start" | "split";
} & (
  | IntegerColumn
  | FloatColumn
  | StringColumn
  | BooleanColumn
  | DateColumn
  | TimeColumn
  | TimestampColumn
  | EnumColumn
  | GeodeticPointColumn
);

export type ResolvedColumnSchema = DataColumn & {
  entrytype: "none";
  datatype: ResolvedDatatype;
};
// END - Schema

// START - Datasets
export type EChartsDataset = Array<Array<any>>;

// Output shape of a GET (SELECT) request to the sql-receptionist or cache.
export interface Dataset {
  columns: Array<string>;
  data: Array<Array<Unknown>>;
}

export type FullDataset = Record<string, Dataset>;

export type VectorDataset = Record<string, Array<any>>;
// END - Datasets
