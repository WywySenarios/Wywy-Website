import type { TableInfo } from "@/types/data";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { createFormSchemaAndHandlers } from "@/components/data/form-helper";
import { Columns, Descriptors, Tags } from "@/components/data/data-entry";
import type z from "zod";
import { toast } from "sonner";
import { getCSRFToken } from "@utils/auth";
import {
  handleRecordOn,
  parseDatabaseValue,
  serializeFormOutput,
  type formOutput,
} from "@utils/data";
import type { JSONValue } from "@utils/http";
import { CACHE_URL } from "astro:env/client";
import { RefreshCcw, Upload } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { GeodeticCoordinate } from "@root/src/utils/datatypes/geodetic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
}: {
  databaseName: string;
  tableInfo: TableInfo;
}) {
  const [startTime, setStartTime] = useState<Date | undefined>(undefined);
  const [isSplit, setIsSplit] = useState<boolean>(false);
  const [isCaching, setIsCaching] = useState<boolean>(false);
  const [cacheError, setCacheError] = useState<boolean>(false);
  const [data, setData] = useState<Record<string, any>>({});

  const isStart: boolean = Object.keys(data).length > 0;
  const { form, formSchema, onSubmit, onSubmitInvalid } =
    createFormSchemaAndHandlers(databaseName, tableInfo, CACHE_URL);

  function fetchCache() {
    // only allow one concurrent fetch
    if (isCaching) return;
    setIsCaching(true);

    fetch(`${CACHE_URL}/cache/${databaseName}/${tableInfo.tableName}`, {
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
          setIsCaching(false);
          setCacheError(true);
          return;
        }

        res
          .json()
          .then((body: Record<string, JSONValue>) => {
            let output: Record<string, any> = {};
            for (let columnSchema of tableInfo.schema) {
              if (columnSchema.name in body) {
                // transform dates to UTC
                switch (columnSchema.datatype) {
                  case "time":
                  case "date":
                  case "timestamp":
                    if (typeof body[columnSchema.name] != "string") {
                      toast(
                        "Expected datatype string for time-related column.",
                      );
                      setCacheError(true);
                      return;
                    }
                    output[columnSchema.name] = parseDatabaseValue(
                      (body[columnSchema.name] as string).slice(1, -1) + "Z",
                      columnSchema.datatype,
                    );
                    break;
                  case "geodetic point":
                    if (typeof body[columnSchema.name] != "string") {
                      toast(
                        "Expected datatype string for geodetic point column.",
                      );
                      setCacheError(true);
                      return;
                    }
                    let latlong_accuracy: number | null = null;
                    let altitude_accuracy: number | null = null;

                    if (
                      `${columnSchema.name}_latlong_accuracy` in body &&
                      typeof body[`${columnSchema.name}_latlong_accuracy`] ==
                        "number"
                    ) {
                      latlong_accuracy = body[
                        `${columnSchema.name}_latlong_accuracy`
                      ] as number;
                    }

                    if (
                      `${columnSchema.name}_altitude_accuracy` in body &&
                      typeof body[`${columnSchema.name}_altitude_accuracy`] ==
                        "number"
                    ) {
                      latlong_accuracy = body[
                        `${columnSchema.name}_altitude_accuracy`
                      ] as number;
                    }

                    output[columnSchema.name] = new GeodeticCoordinate(
                      body[columnSchema.name] as string,
                      latlong_accuracy,
                      altitude_accuracy,
                    );
                    break;
                  default:
                    output[columnSchema.name] = parseDatabaseValue(
                      body[columnSchema.name],
                      columnSchema.datatype,
                    );
                    break;
                }

                if (columnSchema.record_on === "split") setIsSplit(true);
              }
            }

            setData(output);
            setCacheError(false);
          })
          .catch((reason: any) => {
            toast(
              `Something went wrong when trying to read the server's stored time: ${reason}`,
            );
            setIsCaching(false);
            setCacheError(true);
          });
      })
      .catch((reason: any) => {
        toast(
          `Something went wrong when trying to contact the server: ${reason}`,
        );
        setIsCaching(false);
        setCacheError(true);
      });
  }

  // initally try to GET the start time
  useEffect(fetchCache, []);

  // automatically update the cache when the user changes either the start or the end time.
  // only update when desired & valid
  useEffect(() => {
    if (cacheError || !isCaching) return;
    // @TODO generalize
    setStartTime(data["Start Time"]);

    // update form values

    // @TODO restore all default values
    let descriptorDefaultValues: Record<string, Array<Object>> = {};
    if (tableInfo.descriptors) {
      for (let descriptor of tableInfo.descriptors) {
        descriptorDefaultValues[descriptor.name] = [];
      }
    }

    form.reset({ data: data, descriptors: descriptorDefaultValues });

    cache();
  }, [data]);

  /**
   * Stores the startTime and endTime into the cache.
   */
  function cache() {
    let output: formOutput = serializeFormOutput(
      { data: data },
      false,
      tableInfo,
    );

    // store values in cache
    // @TODO don't hardcode start_time & end_time
    getCSRFToken(CACHE_URL)
      .then((csrftoken: string) => {
        fetch(`${CACHE_URL}/cache/${databaseName}/${tableInfo.tableName}`, {
          method: "POST",
          body: JSON.stringify(output.data),
          mode: "cors",
          credentials: "include",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            "X-CSRFToken": csrftoken,
          },
        })
          .catch((reason) => {
            toast(
              `Something went wrong when trying to store the start or end time: ${reason}`,
            );
            setCacheError(true);
          })
          .then(() => {
            setCacheError(false);
          });
      })
      .catch((reason: string) => {
        toast(
          `Something went wrong when trying to store the start or end time: ${reason}`,
        );
        setCacheError(true);
      })
      .finally(() => {
        setIsCaching(false);
      });
  }

  function start() {
    // only allow one concurrent cache operation (avoid race condition)
    if (isCaching) return;
    setIsCaching(true);

    setIsSplit(false);

    handleRecordOn({}, tableInfo, "start", form, toast)
      .then((newData: Record<string, any>) => {
        setData(newData);
      })
      .catch((reason?: any) => {
        if (reason) toast(`Failed to start: ${reason}`);
        setCacheError(true);
      });
  }

  /**
   * Splits the time & records the start & end time in the cache.
   */
  function split() {
    // only allow one concurrent cache operation (avoid race condition)
    if (isCaching) return;
    setIsCaching(true);

    handleRecordOn(data, tableInfo, "split", form, toast)
      .then((newData: Record<string, any>) => {
        setData(newData);
        setIsSplit(true);
      })
      .catch((reason?: any) => {
        if (reason) toast(`Failed to split: ${reason}`);
        setCacheError(true);
      });
  }

  /**
   * Undos and removes the end time from the cache but keeps the start time.
   */
  function cancelSplit() {
    if (isCaching) return;
    setIsCaching(true);

    handleRecordOn(data, tableInfo, "split", form, toast, "purge")
      .then((newData: Record<string, any>) => {
        setData(newData);
        setIsSplit(false);
      })
      .catch((reason?: any) => {
        if (reason) toast(`Failed to cancel split: ${reason}`);
        setCacheError(true);
      });
  }

  /**
   * Completely empty the cache (both start and end times)
   */
  function cancel() {
    if (isCaching) return;
    setIsCaching(true);

    setIsSplit(false);

    setData({});
  }

  function submission(
    values: z.infer<typeof formSchema>,
    event?: React.BaseSyntheticEvent,
  ): void {
    const submitter = (event?.nativeEvent as SubmitEvent)?.submitter;
    const action = submitter?.getAttribute("value");

    onSubmit(values);

    switch (action) {
      case "split":
        start();
        break;
      default:
        cancel();
    }
  }

  if (cacheError)
    return (
      <div className="flex flex-col items-center">
        <p>Something went wrong while caching.</p>
        <div className="flex flex-row">
          <Button onClick={fetchCache}>
            <RefreshCcw></RefreshCcw>
          </Button>
          <Button onClick={cache}>
            <Upload />
          </Button>
        </div>
      </div>
    );

  if (isSplit) {
    return (
      <form
        onSubmit={form.handleSubmit(submission, onSubmitInvalid)}
        className="flex flex-col gap-4"
      >
        <Button type="button" disabled={isCaching} onClick={cancelSplit}>
          {isCaching ? (
            <div className="flex flex-row justify-center items-center gap-2">
              <Spinner data-icon="inline-start" />
              Cancel
            </div>
          ) : (
            "Cancel"
          )}
        </Button>
        {/* Submit button */}
        <Button type="submit">Submit</Button>
        {/* Columns */}
        <Columns fieldsToEnter={tableInfo.schema} form={form} />
        {/* Quick actions */}
        {/* Tags */}
        {tableInfo.tagging && (
          <Tags databaseName={databaseName} tableInfo={tableInfo} form={form} />
        )}
        {/* Descriptors */}
        {tableInfo.descriptors && (
          <Descriptors tableInfo={tableInfo} form={form} />
        )}
        {/* Submit & restart button */}
        <Button type="submit" value="split">
          Submit & Restart
        </Button>
      </form>
    );
  }

  let mainButtonBody;
  if (isCaching) {
    mainButtonBody = (
      <div className="flex gap-2 items-center">
        <Spinner className="h-[1ch] w-[1ch]" data-icon="inline-start" />
        <p className="justify-center">Caching...</p>
      </div>
    );
  } else {
    mainButtonBody = isStart ? "Split" : "Start";
  }

  return (
    <div className="flex flex-col items-center">
      <p>{isStart ? startTime?.toLocaleString() : "No start time."}</p>
      <div className="flex flex-row justify-center">
        <Button
          className="min-w-[16ch]"
          disabled={isCaching}
          onClick={isStart ? split : start}
        >
          {mainButtonBody}
        </Button>
        <Button
          className="min-w-[12ch]"
          disabled={!isStart || isCaching}
          onClick={cancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
