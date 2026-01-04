import type { DataColumn } from "@/env"
import {
    DialogHeader,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react";
import { createFormSchemaAndHandlers } from "@/components/data/form-helper";
import { Columns } from "@/components/data/data-entry"

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
    const { form, onSubmit, onSubmitInvalid } = createFormSchemaAndHandlers(fieldsToEnter, databaseName, tableName, dbURL)

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
    }, [])



    return <Dialog>
        <div className="flex flex-col items-center">
            <p>{startTime ? startTime?.toLocaleString() : "No start time."}</p>
            <div className="flex flex-row justify-center">
                <Button onClick={start}>Start</Button>
                <DialogTrigger asChild>
                    <Button>End/Split</Button>
                </DialogTrigger>
                <Button onClick={cancel}>Cancel</Button>
            </div>
        </div>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Event</DialogTitle>
                {/* <DialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove your data from our servers.
                </DialogDescription> */}
            </DialogHeader>
            <form onSubmit={form.handleSubmit(submission, onSubmitInvalid)} className="flex flex-col gap-4">
                {/* Submit & restart button */}
                <DialogClose asChild>
                    <Button type="submit" value="split"></Button>
                </DialogClose>
                {/* Columns */}
                <Columns fieldsToEnter={fieldsToEnter} form={form} />
                {/* Quick actions */}
                {/* Tags */}
                {/* Descriptors */}
                {/* Submit button */}
                <DialogClose asChild>
                    <Button type="submit">Submit</Button>
                </DialogClose>
            </form>
        </DialogContent>
    </Dialog>
}