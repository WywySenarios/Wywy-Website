import type { JSX } from "astro/jsx-runtime";
import { FormElement } from "@/components/data/input-elements";
import type { DataColumn, TableInfo } from "@/env";

export function Columns({
    fieldsToEnter,
    form
}: {
    fieldsToEnter: Array<DataColumn>,
    form: any,
}): JSX.Element {
    return (
        <div>
            {fieldsToEnter.map((columnInfo: DataColumn) => {
                return (
                    <FormElement key={columnInfo.name + "-form-element"} form={form} columnInfo={columnInfo} />
                )
            }
            )
            }
        </div>
    )
}

/**
 * The tagging related form component.
 * @param databaseName The name of the database that this form gathers data for.
 * @param tableName The name of the table that this form gathers data for.
 * @param dbURL The URL that the form will post to on submit.
 * @returns 
 */
export function Tags({

}: {
    databaseName: string,
    tableName: string,
    dbURL: string
}): JSX.Element {
    return (
        <></>
    )
}

/**
 * The desciptor related form component.
 * @param databaseName The name of the database that this form gathers data for.
 * @param tableInfo The schema for the respective table.
 * @param dbURL The URL that the form will post to on submit.
 * @returns 
 */
export function Descriptors({
    databaseName,
    tableInfo,
    dbURL
}: {
    databaseName: string,
    tableInfo: TableInfo
    dbURL: string
}): JSX.Element {
    return (
        <></>
    )
}