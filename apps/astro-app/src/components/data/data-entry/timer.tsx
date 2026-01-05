import type { DataColumn } from "@/env"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react";
import { createFormSchemaAndHandlers } from "@/components/data/form-helper";
import { Columns } from "@/components/data/data-entry"
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export function TimerForm({
    fieldsToEnter,
    databaseName,
    tableName,
    dbURL
}: {
    fieldsToEnter: Array<DataColumn>,
    databaseName: string,
    tableName: string,
    dbURL: string
}) {
    const [startTime, setStartTime] = useState<Date | undefined>(undefined);
    const [form, setForm] = useState<UseFormReturn<{
        [x: string]: any;
    }, any, {
        [x: string]: any;
    }>>(useForm({ resolver: zodResolver(z.object({})) }));
    const [onSubmit, setOnSubmit] = useState<Function>(() => { });
    const [onSubmitInvalid, setOnSubmitInvalid] = useState<Function>(() => { });
    //  { form, onSubmit, onSubmitInvalid } = createFormSchemaAndHandlers(fieldsToEnter, databaseName, tableName, dbURL)

    // initally try to GET the start time
    useEffect(() => {
        fetch(`${dbURL}/cache/${databaseName}/${tableName}`, {
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

    function start() {
        if (startTime !== undefined) return
        let newTime: Date = new Date(Date.now());
        console.log(newTime)
        let newTimeISO: string = newTime.toISOString()
        newTimeISO = newTimeISO.substring(0, newTimeISO.length - 1)

        // store the new time in the cache
        // @TODO don't hardcode start_time
        fetch(`${dbURL}/cache/${databaseName}/${tableName}`, {
            method: "POST",
            body: JSON.stringify({
                "Start Time": `'${newTimeISO}'`
            }),
            mode: "cors",
            credentials: "include",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "X-CSRFToken": csrftoken,
            }
        })

        // reload the component with the correct start time
        setStartTime(newTime)
        const { form, onSubmit, onSubmitInvalid } = createFormSchemaAndHandlers(fieldsToEnter, databaseName, tableName, dbURL)
        setForm(form);
        setOnSubmit(onSubmit);
        setOnSubmitInvalid(onSubmitInvalid);
    }

    function cancel() {
        // empty the cache (store an empty object)
        fetch(`${dbURL}/cache/${databaseName}/${tableName}`, {
            method: "POST",
            body: JSON.stringify({}),
            mode: "cors",
            credentials: "include",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "X-CSRFToken": csrftoken,
            }
        })

        setStartTime(undefined)
    }

    return (
        <div>
            {
                startTime ? <form onSubmit={form.handleSubmit(submission, onSubmitInvalid)} className="flex flex-col gap-4">
                    <Button disabled={startTime === undefined} onClick={cancel}>Cancel</Button>
                    {/* Submit & restart button */}
                    <Button type="submit" value="split">Submit & Restart</Button>
                    {/* Columns */}
                    <Columns fieldsToEnter={fieldsToEnter} form={form} />
                    {/* Quick actions */}
                    {/* Tags */}
                    {/* Descriptors */}
                    {/* Submit button */}
                    <Button type="submit">Submit</Button>
                </form> : <div className="flex flex-col items-center">
                    <p>{startTime ? startTime?.toLocaleString() : "No start time."}</p>
                    <div className="flex flex-row justify-center">
                        <Button onClick={start}>Start</Button>
                        {/* <Button disabled={!startTime} onClick={() => {
                            // @TODO do not hardcode key
                            window.location.href = `?Start Time=${startTime?.toISOString()}`;
                        }}>End/Split</Button> */}
                        {/* <Button disabled={startTime === undefined} onClick={cancel}>Cancel</Button> */}
                    </div> </div>
            }
        </div>
    )
}