"use client"

import type { DataColumn, TableInfo } from "@/env"
import type { JSX } from "astro/jsx-runtime"
import { FormForm } from "@/components/data/data-entry/form"
import { TimerForm } from "@/components/data/data-entry/timer"

/**
 * Selects the correct form element to use. Expects there to be a valid Toast element inside the page.
 * @param entrytype The entrytype of the form.
 * @param fieldsToEnter
 * @param databaseName The name of the database that this form gathers data for.
 * @param tableName The name of the table that this form gathers data for.
 * @param dbURL The URL that the form will post to on submit.
 */
export default function DataEntryForm({
    entrytype,
    fieldsToEnter,
    databaseName,
    tableName,
    dbURL
}: {
    entrytype: TableInfo["entrytype"],
    fieldsToEnter: Array<DataColumn>,
    databaseName: string,
    tableName: string,
    dbURL: string
}): JSX.Element {
    switch (entrytype) {
        case "form":
            return <FormForm fieldsToEnter={fieldsToEnter} databaseName={databaseName} tableName={tableName} dbURL={dbURL} />
        case "timer":
            return <TimerForm fieldsToEnter={fieldsToEnter} databaseName={databaseName} tableName={tableName} dbURL={dbURL} />
    }
}