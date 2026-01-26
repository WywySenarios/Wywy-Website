import type { TableInfo } from "@/env";
import { Button } from "@/components/ui/button";
import { useEffect, useState, type JSX } from "react";
import { createFormSchemaAndHandlers } from "@/components/data/form-helper";
import { Columns, Descriptors, Tags } from "@/components/data/data-entry";
import type z from "zod";
import { toast } from "sonner";
import { getCSRFToken } from "@/utils/auth";

// child component to circumvent hook rules
function TimerFormForm({
  setStartTime,
  setEndTime,
  cancelButton,
  databaseName,
  tableInfo,
  dbURL,
}: {
  setStartTime: React.Dispatch<React.SetStateAction<Date | undefined>>;
  setEndTime: React.Dispatch<React.SetStateAction<Date | undefined>>;
  cancelButton: JSX.Element;
  databaseName: string;
  tableInfo: TableInfo;
  dbURL: string;
}) {
  const { form, formSchema, onSubmit, onSubmitInvalid } =
    createFormSchemaAndHandlers(databaseName, tableInfo, dbURL);

  function submission(
    values: z.infer<typeof formSchema>,
    event?: React.BaseSyntheticEvent,
  ): void {
    const submitter = (event?.nativeEvent as SubmitEvent)?.submitter;
    const action = submitter?.getAttribute("value");

    onSubmit(values);

    setEndTime(undefined);
    if (action === "split") setStartTime(new Date(Date.now()));
  }

  return (
    <form
      onSubmit={form.handleSubmit(submission, onSubmitInvalid)}
      className="flex flex-col gap-4"
    >
      {cancelButton}
      {/* Submit & restart button */}
      <Button type="submit" value="split">
        Submit & Restart
      </Button>
      {/* Columns */}
      <Columns fieldsToEnter={tableInfo.schema} form={form} />
      {/* Quick actions */}
      {/* Tags */}
      {tableInfo.tagging && (
        <Tags
          databaseName={databaseName}
          tableInfo={tableInfo}
          form={form}
          dbURL={dbURL}
        />
      )}
      {/* Descriptors */}
      {tableInfo.descriptors && (
        <Descriptors tableInfo={tableInfo} form={form} />
      )}
      {/* Submit button */}
      <Button type="submit">Submit</Button>
    </form>
  );
}

/**
 * Timer based form component. Expects "Start Time" & "End Time" columns to be present.
 * @param databaseName The name of the database that this form gathers data for.
 * @param tableInfo The full table schema.
 * @param dbURL The URL that the form will post to on submit.
 */
export function TimerForm({
  databaseName,
  tableInfo,
  dbURL,
}: {
  databaseName: string;
  tableInfo: TableInfo;
  dbURL: string;
}) {
  const [startTime, setStartTime] = useState<Date | undefined>(undefined);
  const [endTime, setEndTime] = useState<Date | undefined>(undefined);

  // initally try to GET the start time
  useEffect(() => {
    fetch(`${dbURL}/cache/${databaseName}/${tableInfo.tableName}`, {
      method: "GET",
      mode: "cors",
      credentials: "include",
      headers: {},
    })
      .then((res: Response) => {
        if (res.status == 403) {
          toast(
            "Something went wrong while fetching the start/end time: Invalid credentials.",
          );
          return;
        }

        res
          .json()
          .then((body: object) => {
            if (
              "Start Time" in body &&
              body["Start Time"] !== undefined &&
              typeof body["Start Time"] === "string" &&
              body["Start Time"].length > 2
            ) {
              let value: string = body["Start Time"].substring(
                1,
                body["Start Time"].length - 1,
              );
              let newDate: Date = new Date(Date.parse(value));
              if (!isNaN(newDate.getTime())) setStartTime(newDate);
            }
            if (
              "End Time" in body &&
              body["End Time"] !== undefined &&
              typeof body["End Time"] === "string" &&
              body["End Time"].length > 2
            ) {
              let value: string = body["End Time"].substring(
                1,
                body["End Time"].length - 1,
              );
              let newDate: Date = new Date(Date.parse(value));
              if (!isNaN(newDate.getTime())) setEndTime(newDate);
            }
          })
          .catch((reason: any) => {
            toast(
              `Something went wrong when trying to read the server's stored time: ${reason}`,
            );
          });
      })
      .catch((reason: any) => {
        toast(
          `Something went wrong when trying to contact the server: ${reason}`,
        );
      });
  }, []);

  // automatically update the cache when the user changes either the start or the end time.
  useEffect(cache, [startTime, endTime]);

  /**
   * Stores the startTime and endTime into the cache.
   */
  function cache() {
    interface outputType {
      "Start Time"?: string;
      "End Time"?: string;
    }
    let output: outputType = {};
    // stringify the two dates if possible
    if (startTime) {
      output["Start Time"] = `'${startTime.toISOString().slice(0, -1)}'`;
    }
    if (endTime) {
      output["End Time"] = `'${endTime.toISOString().slice(0, -1)}'`;
    }

    // store values in cache
    // @TODO don't hardcode start_time & end_time
    getCSRFToken(dbURL)
      .then((csrftoken: string) => {
        fetch(`${dbURL}/cache/${databaseName}/${tableInfo.tableName}`, {
          method: "POST",
          body: JSON.stringify(output),
          mode: "cors",
          credentials: "include",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            "X-CSRFToken": csrftoken,
          },
        });
      })
      .catch((reason: string) => {
        toast(
          `Something went wrong when trying to store the start or end time: ${reason}`,
        );
      });
  }

  function start() {
    if (startTime !== undefined) return;
    setStartTime(new Date(Date.now()));
  }

  /**
   * Splits the time & records the start & end time in the cache.
   */
  function split() {
    setEndTime(new Date(Date.now()));
  }

  /**
   * Undos and removes the end time from the cache but keeps the start time.
   */
  function cancelSplit() {
    setEndTime(undefined);
  }

  /**
   * Completely empty the cache (both start and end times)
   */
  function cancel() {
    setStartTime(undefined);
    setEndTime(undefined);
  }

  return (
    <div>
      {endTime ? (
        <TimerFormForm
          setStartTime={setStartTime}
          setEndTime={setEndTime}
          cancelButton={
            <Button disabled={startTime === undefined} onClick={cancelSplit}>
              Cancel
            </Button>
          }
          databaseName={databaseName}
          tableInfo={tableInfo}
          dbURL={dbURL}
        />
      ) : (
        <div className="flex flex-col items-center">
          <p>{startTime ? startTime?.toLocaleString() : "No start time."}</p>
          <div className="flex flex-row justify-center">
            <Button onClick={startTime ? split : start}>
              {startTime ? "Split" : "Start"}
            </Button>
            <Button disabled={startTime === undefined} onClick={cancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
