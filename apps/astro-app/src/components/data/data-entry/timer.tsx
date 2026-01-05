import type { TableInfo } from "@/env"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react";
import { createFormSchemaAndHandlers, type Form, type OnSubmitInvalid } from "@/components/data/form-helper";
import { Columns } from "@/components/data/data-entry"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export function TimerForm({
    databaseName,
    tableInfo,
    dbURL
}: {
    databaseName: string,
    tableInfo: TableInfo,
    dbURL: string
}) {
    const [startTime, setStartTime] = useState<Date | undefined>(undefined);
    const [endTime, setEndTime] = useState<Date | undefined>(undefined);
    const [form, setForm] = useState<Form>(useForm({ resolver: zodResolver(z.object({data: z.object({})})) }));
    const [onSubmit, setOnSubmit] = useState<Function>(() => { });
    const [onSubmitInvalid, setOnSubmitInvalid] = useState<OnSubmitInvalid>(() => { });
    //  { form, onSubmit, onSubmitInvalid } = createFormSchemaAndHandlers(fieldsToEnter, databaseName, tableName, dbURL)

    // initally try to GET the start time
    useEffect(() => {
        fetch(`${dbURL}/cache/${databaseName}/${tableInfo.tableName}`, {
            method: "GET",
            mode: "cors",
            credentials: "include",
            headers: {}
        }).then((res: Response) => {
            res.json().then((body: object) => {
                console.log(body)
                if ("Start Time" in body && body["Start Time"] !== undefined && typeof body["Start Time"] === "string" && body["Start Time"].length > 2) {
                    let value: string = body["Start Time"].substring(1, body["Start Time"].length - 1)
                    let newDate: Date = new Date(Date.parse(value));
                    if (!isNaN(newDate.getTime())) setStartTime(newDate);
                }
                if ("End Time" in body && body["End Time"] !== undefined && typeof body["End Time"] === "string" && body["End Time"].length > 2) {
                    let value: string = body["End Time"].substring(1, body["End Time"].length - 1)
                    let newDate: Date = new Date(Date.parse(value));
                    if (!isNaN(newDate.getTime())) setEndTime(newDate);
                }
            })
        })
    }, []);

    function submission(values: {
        [x: string]: any;
    },
        event?: React.BaseSyntheticEvent): void {
        const submitter = (event?.nativeEvent as SubmitEvent)?.submitter;
        const action = submitter?.getAttribute("value");

        onSubmit(values);

        if (action === "split") start()
    }

    // START - CSRF token
    function getCookie(name: string) {
        return document.cookie
            .split("; ")
            .find(row => row.startsWith(name + "="))
            ?.split("=")[1];
    }

    const csrftoken = getCookie("csrftoken");
    // END - CSRF token

    function cache() {
        interface outputType {
            "Start Time"?: string
            "End Time"?: string
        }
        let output: outputType = {}
        // stringify the two dates if possible
        if (startTime) {
            output["Start Time"] = `'${startTime.toISOString().slice(0, -1)}'`;
        }
        if (endTime) {
            output["End Time"] = `'${endTime.toISOString().slice(0, -1)}'`;
        }
        
        // store values in cache
        // @TODO don't hardcode start_time & end_time
        fetch(`${dbURL}/cache/${databaseName}/${tableInfo.tableName}`, {
            method: "POST",
            body: JSON.stringify(output),
            mode: "cors",
            credentials: "include",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "X-CSRFToken": csrftoken,
            }
        })
    }

    useEffect(cache, [startTime, endTime]);

    function start() {
        if (startTime !== undefined) return
        setStartTime(new Date(Date.now()))
    }

    /**
     * Splits the time & records the start & end time in the cache.
     */
    function split() {
        // record the current time
        setEndTime(new Date(Date.now()));
        const { form, onSubmit, onSubmitInvalid } = createFormSchemaAndHandlers(databaseName, tableInfo, dbURL)
        setForm(form);
        setOnSubmit(onSubmit);
        setOnSubmitInvalid(onSubmitInvalid as OnSubmitInvalid);
    }

    function cancelSplit() {
        setEndTime(undefined);
    }

    function cancel() {
        // empty the cache (store an empty object)
        setStartTime(undefined);
        setEndTime(undefined);
    }

    return (
        <div>
            {
                endTime ? <form onSubmit={form.handleSubmit(submission, onSubmitInvalid)} className="flex flex-col gap-4">
                    <Button disabled={startTime === undefined} onClick={cancelSplit}>Cancel</Button>
                    {/* Submit & restart button */}
                    <Button type="submit" value="split">Submit & Restart</Button>
                    {/* Columns */}
                    <Columns fieldsToEnter={tableInfo.schema} form={form} />
                    {/* Quick actions */}
                    {/* Tags */}
                    {/* Descriptors */}
                    {/* Submit button */}
                    <Button type="submit">Submit</Button>
                </form> : <div className="flex flex-col items-center">
                    <p>{startTime ? startTime?.toLocaleString() : "No start time."}</p>
                    <div className="flex flex-row justify-center">
                        <Button onClick={startTime ? split : start}>{startTime ? "Split" : "Start"}</Button>
                        <Button disabled={startTime === undefined} onClick={cancel}>Cancel</Button>
                    </div>
                    </div>
            }
        </div>
    )
}