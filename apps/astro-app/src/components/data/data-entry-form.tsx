"use client"

import type { TableInfo } from "@/env"
import type { JSX } from "astro/jsx-runtime"
import { FormForm } from "@/components/data/data-entry/form"
import { TimerForm } from "@/components/data/data-entry/timer"

/**
 * Selects the correct form element to use. Expects there to be a valid Toast element inside the page.
 * @param databaseName The name of the database that this form gathers data for.
 * @param tableInfo The full table schema.
 * @param dbURL The URL that the form will post to on submit.
 */
export default function DataEntryForm({
    databaseName,
    tableInfo,
    dbURL
}: {
    databaseName: string,
    tableInfo: TableInfo,
    dbURL: string
}): JSX.Element {
    switch (tableInfo.entrytype) {
        case "form":
            return <FormForm databaseName={databaseName} tableInfo={tableInfo} dbURL={dbURL} />
        case "timer":
            return <TimerForm databaseName={databaseName} tableInfo={tableInfo} dbURL={dbURL} />
    }
}