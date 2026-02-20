export interface DatabaseInfo {
  dbname: string;
  tables: Array<TableInfo>;
}

export interface DescriptorInfo {
  name: string;
  schema: Array<DataColumn>;
}

export interface TableInfo {
  tableName: string;
  entrytype: "form" | "timer";
  read: boolean;
  write: boolean;
  comments: boolean;
  tagging: boolean;
  schema: Array<DataColumn>;
  descriptors: Array<DescriptorInfo>;
}

// look at the restrictions for different entry types
// @TODO find out if it's possible to restrict  the value of defaultValue before runtime
type NoRestrictions = {
  entrytype: "none";
};

type TextboxRestrictiions = {
  entrytype: "textbox";
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
} & (SliderRestrictions | RadioRestrictions);

type FloatColumn = {
  datatype: "float" | "number";
  defaultValue?: number;
} & (SliderRestrictions | RadioRestrictions);

type StringColumn = {
  datatype: "string" | "str" | "text";
  defaultValue?: string;
} & TextboxRestrictiions;

type BooleanColumn = {
  datatype: "bool" | "boolean";
  defaultValue?: boolean;
} & (RadioRestrictions | SwitchRestrictions);

type DateColumn = {
  datatype: "date";
  defaultValue?: string; // @TODO consider switching datatypes?
} & DateRestrictions;

type TimeColumn = {
  datatype: "time";
  defaultValue?: string; // @TODO consider switching datatypes?
} & TimeRestrictions;

type TimestampColumn = {
  datatype: "timestamp";
  defaultValue?: string; // @TODO consider switching datatypes?
} & TimestampRestrictions;

type EnumColumn = {
  datatype: "enum";
  defaultValue: string; // @TODO ensure defaultValue is within values
} & SelectRestrictions;

export type DataColumn = {
  name: string;
  parser?: zodPrimaryDatatypes;
  datatype: zodPrimaryDatatypes;
  // Definitely optional:
  //@TODO add regex restrictions
  // restrictions?: Array<[number, number]>
  invalidInputMessage?: string;
  comments?: boolean;
  description?: string;
  unique?: boolean;
} & (
  | IntegerColumn
  | FloatColumn
  | StringColumn
  | BooleanColumn
  | DateColumn
  | TimeColumn
  | TimestampColumn
  | EnumColumn
);

export type Dataset = Array<Array<any>>;
