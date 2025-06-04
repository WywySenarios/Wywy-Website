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
        [columnName: string]: ColumnSchema
    }
}

export interface ColumnSchema {

    [columnName: string]: {
        datatype: "date" | "int" | "integer" | "float" | "number" | "string" | "str" | "text" | "json" | "JSON" | "bool" | "boolean",
        //@TODO ensure the entry method is valid
        entrytype: "linearSlider" | "radialSlider" | "textbox" | "radio" | "bigButton" | "entries" | "none",
        //@TODO ensure these are here when needed
        whitelist?: Array<string>,
        constituents?: {
            [constituentName: string]: ColumnSchema
        }
        // Definitely optional:
        //@TODO add regex restrictions
        restrictions?: Array<[number, number]>
        comments?: boolean,
        prompt?: string,
        params: {
            primaryKey?: boolean,
            autoIncrement?: boolean,
        }
    },
}
// END - Database Related