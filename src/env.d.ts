/// <reference path="../.astro/types.d.ts" />

import type { zodPrimaryDatatypes } from "./constants"

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
    data: {
        databases: Record<string, DatabaseInfo>
    },
}

// Database Related
export interface DatabaseInfo {
    databaseName: string,
    schema: {
        [columnName: string]: DataColumn | JsonColumn
    }
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

// look at different datatypes
type IntegerColumn = {
    datatype: "int" | "integer"
    defaultValue?: number
    entrytype: "linearSlider" | "radio" | "none"
} & (SliderRestrictions | RadioRestrictions | NoRestrictions)

type FloatColumn = {
    datatype: "float" | "number"
    defaultValue?: number
    entrytype: "linearSlider" | "radialSlider" | "radio" | "none"
} & (SliderRestrictions | RadioRestrictions | NoRestrictions)

type StringColumn = {
    datatype: "string" | "str" | "text"
    defaultValue?: string
    entrytype: "textbox" | "radio" | "none"
} & (TextboxRestrictiions | RadioRestrictions | NoRestrictions)

type BooleanColumn = {
    datatype: "bool" | "boolean"
    defaultValue?: boolean
    entrytype: "radio" | "switch" | "none"
} & (RadioRestrictions | BigButtonRestrictions | NoRestrictions)

type DateColumn = {
    datatype: "date"
    defaultValue?: Date
    entrytype: string
}

export type DataColumn = {
    datatype: zodPrimaryDatatypes
    // Definitely optional:
    //@TODO add regex restrictions
    // restrictions?: Array<[number, number]>
    invalidInputMessage?: string
    comments?: boolean
    prompt?: string
    params: {
        primaryKey?: boolean
        autoIncrement?: boolean
    }
} & (IntegerColumn | FloatColumn | StringColumn | BooleanColumn | DateColumn)

export interface JsonColumn {
    datatype: "json" | "JSON"
    entrytype: "entries" | "none"
    constituents: {
        [constitutentName: string]: DataColumn
    }
}
// END - Database Related