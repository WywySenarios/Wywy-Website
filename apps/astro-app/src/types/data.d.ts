import { DashboardComponentBaseSchema } from "./dashboard";

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
  | "geodetic point"
  | "pointer"
  | "polypointer"
  | "polymorphic pointer";

export type ResolvedDatatype =
  | "int"
  | "number"
  | "str"
  | "bool"
  | "date"
  | "time"
  | "timestamp"
  | "enum"
  | "geodetic point"
  | "pointer"
  | "polypointer";

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

type NumberBoxRestrictions = {
  entrytype: "numberbox";
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
} & (
  | SliderRestrictions
  | RadioRestrictions
  | NumberBoxRestrictions
  | NoRestrictions
);

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

type PointerColumn = {
  datatype: "pointer";
  defaultValue: never;
  entrytype: "pointer" | "none";
  references?: string;
};

type PolyPointerColumn = {
  datatype: "polypointer" | "polymorphic pointer";
  defaultValue: never;
  entrytype: "polypointer" | "none";
  references?: string[];
};

export type RecordOnEvent = "start" | "split" | "submit";

export type DataColumn = {
  name: string;
  parser?: Datatype;
  datatype: Datatype;
  invalidInputMessage?: string;
  comments?: boolean;
  description?: string;
  unique?: boolean;
  optional?: boolean;
  record_on?: RecordOnEvent;
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
  | PointerColumn
  | PolyPointerColumn
);

export type ResolvedColumnSchema = DataColumn & {
  entrytype: "none" | "pointer" | "polypointer";
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

// Basic table type.
export type TableType =
  | "data"
  | "descriptors"
  | "search"
  | "tags"
  | "tag_names"
  | "tag_aliases"
  | "tag_groups";
