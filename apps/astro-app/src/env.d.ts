/// <reference path="../.astro/types.d.ts" />

import type { zodPrimaryDatatypes } from "./utils/data"

declare module "env" {
    const config: MainConfigSchema
    export = config;
}

export interface MainConfigSchema {
    websiteTitle: string, // Title of the website (e.g. "EZ & Wywy's Website!")
    websiteIcon: string, // path (relative to the public folder) for the website icon (e.g. "/favicon.svg")
    python: string, // path to python executeable to be used (e.g. ".venv\\Scripts\\python.exe")
    features: { // enable/disbable features
        dataHarvesting: boolean,
    },
    // govern website content
    websiteData: {
        schedule: string, // schedule to be displayed (e.g. default)
        blog: {
            homepage: {
                pinned: Array<string>, // pinned posts (urls?)
            }
        },
        Senarios: {
            homepage: {
                pinned: Array<string>, // @TODO explain
            }
        },
    },
    data: Array<DatabaseInfo>,
}

// Database Related
export interface DatabaseInfo {
    dbname: string,
    tables: Array<TableInfo>
}

export interface TableInfo {
    tableName: string,
    read: bool,
    write: bool,
    entrytype: "form" | "entries",
    schema: Array<DataColumn>
}

// look at the restrictions for different entry types
// @TODO find out if it's possible to restrict  the value of defaultValue before runtime
type NoRestrictions = {
    entrytype: "none",
}

type TextboxRestrictiions = {
    entrytype: "textbox",
}

type SliderRestrictions = {
    entrytype: "linearSlider",
    min?: number,
    max?: number,
}

type RadioRestrictions = {
    entrytype: "radio",
    whitelist: Array<string>,
}

type SwitchRestrictions = {
    entrytype: "switch",
}

type DateRestrictions = {
    entrytype: "calendar",
    //min?: Date,
    //max?: Date,
}

type TimeRestrictions = {
    entrytype: "time",
}

// look at different datatypes
type IntegerColumn = {
    datatype: "int" | "integer"
    defaultValue?: number
} & (SliderRestrictions | RadioRestrictions | NoRestrictions)

type FloatColumn = {
    datatype: "float" | "number"
    defaultValue?: number
} & (SliderRestrictions | RadioRestrictions | NoRestrictions)

type StringColumn = {
    datatype: "string" | "str" | "text"
    defaultValue?: string
} & (TextboxRestrictiions | RadioRestrictions | NoRestrictions)

type BooleanColumn = {
    datatype: "bool" | "boolean"
    defaultValue?: boolean
} & (RadioRestrictions | SwitchRestrictions | NoRestrictions)

type DateColumn = {
    datatype: "date"
    defaultValue?: Date
} & (DateRestrictions | NoRestrictions)

type TimeColumn = {
    datatype: "time"
    defaultValue?: Date // @TODO consider switching datatypes?
} & (TimeRestrictions | NoRestrictions)

type TimestampColumn = {
    datatype: "timestamp"
    defaultValue?: Date // @TODO consider switching datatypes?
} & (TimeRestrictions | DateRestrictions)

export type DataColumn = {
    name: string
    datatype: zodPrimaryDatatypes
    // Definitely optional:
    //@TODO add regex restrictions
    // restrictions?: Array<[number, number]>
    invalidInputMessage?: string
    comments?: boolean
    description?: string
    unique?: boolean
} & (IntegerColumn | FloatColumn | StringColumn | BooleanColumn | DateColumn | TimeColumn | TimestampColumn)

export type Dataset = Array<Array<any>>;
// END - Database Related