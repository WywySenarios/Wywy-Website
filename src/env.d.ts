/// <reference path="../.astro/types.d.ts" />

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

type IntegerColumn = {
    datatype: "int" | "integer"
    defaultValue?: number
    entrytype: string
}
type FloatColumn = {
    datatype: "float" | "number"
    defaultValue?: number
    entrytype: string
}
type StringColumn = {
    datatype: "string" | "str" | "text"
    defaultValue?: string
    entrytype: string
}
type BooleanColumn = {
    datatype: "bool" | "boolean"
    defaultValue?: boolean
    entrytype: string
}
type DateColumn = {
    datatype: "date"
    defaultValue?: Date
    entrytype: string
}

export type DataColumn = {
    //@TODO ensure the entry method is valid
    // entrytype: "linearSlider" | "radialSlider" | "textbox" | "radio" | "bigButton" | "none"
    //@TODO ensure these are here when needed
    whitelist?: Array<string>
    // defaultValue?: string
    // Definitely optional:
    //@TODO add regex restrictions
    restrictions?: Array<[number, number]>
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