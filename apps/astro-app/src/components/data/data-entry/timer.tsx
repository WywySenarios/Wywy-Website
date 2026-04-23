import type { TableInfo } from "@/types/data";
import { Button } from "@/components/ui/button";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Columns, Descriptors, Tags } from "@/components/data/data-entry";
import type z from "zod";
import { toast } from "sonner";
import { CACHE_CSRF_ENDPOINT, getCSRFToken } from "@utils/auth";
import { parseDatabaseValue } from "@utils/data/deserialization";
import { handleRecordOn } from "@utils/data/form/updates";
import type { JSONValue } from "@/types/http";
import { CACHE_URL } from "astro:env/client";
import { RefreshCcw, Upload } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { GeodeticCoordinate } from "@utils/datatypes/geodetic";
import { createFormController } from "@/utils/data/form/full-entry-handlers";
import { safeFetchDataset, submitEntry } from "@/utils/data/http";
import type { FieldErrors } from "react-hook-form";
import {
  TAG_NAMES_DATASET_SCHEMA,
  type TAG_NAMES_DATASET,
} from "@utils/data/schema";
import { toSnakeCase } from "@utils/parse";

/**
 * Helper to a load tag names dataset. Assumes that only one concurrent fetch can occur.
 * @param endpoint The endpoint to GET.
 * @param setTagNames The setter for the tagNames dataset.
 * @param setTagsLoading The setter for the loading state.
 */
function loadTagNames(
  endpoint: string,
  setTagNames: Dispatch<SetStateAction<TAG_NAMES_DATASET | undefined>>,
  setTagsLoading: Dispatch<SetStateAction<boolean>>,
) {
  // only allow one concurrent fetch
  setTagsLoading(true);

  // safe fetch dataset
  safeFetchDataset(endpoint, TAG_NAMES_DATASET_SCHEMA)
    .then((tagNames) => {
      setTagNames(tagNames);
    })
    .catch((reason) => {
      toast(`Failed to load tags: ${reason}`);
      setTagNames(undefined);
    })
    .finally(() => {
      setTagsLoading(false);
    });
}

/**
 * Timer based form component. Expects "Start Time" & "End Time" columns to be present.
 * @param databaseName The name of the database that this form gathers data for.
 * @param tableInfo The full table schema.
 */
export function TimerForm({
  databaseName,
  tableInfo,
  submissionCallback = () => {},
}: {
  databaseName: string;
  tableInfo: TableInfo;
  submissionCallback?: () => void;
}) {
  const [isSplit, setIsSplit] = useState<boolean>(false);
  const [tagNames, setTagNames] = useState<TAG_NAMES_DATASET>();
  const [tagsLoading, setTagsLoading] = useState<boolean>(false);
  const [tagsRefreshState, setTagsRefreshState] = useState<number>(0);
  const [isCaching, setIsCaching] = useState<boolean>(false);
  const [cacheError, setCacheError] = useState<boolean>(false);
  const [data, setData] = useState<Record<string, any>>({});

  const isStart: boolean = Object.keys(data).length > 0;
  const { controller, schema } = createFormController(tableInfo);

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
        if (!res.ok) {
          toast(
            `Something went wrong while fetching the start/end time: ${res.status} ${res.statusText}`,
          );
          setIsCaching(false);
          setCacheError(true);
          return;
        }

        res
          .json()
          .then((body: Record<string, JSONValue>) => {
            let output: Record<string, any> = {};
            for (const columnSchema of tableInfo.schema) {
              const columnName = toSnakeCase(columnSchema.name);
              if (columnName in body) {
                // transform dates to UTC
                switch (columnSchema.datatype) {
                  case "geodetic point":
                    if (typeof body[columnName] != "string") {
                      toast(
                        "Expected datatype string for geodetic point column.",
                      );
                      setCacheError(true);
                      return;
                    }
                    let latlong_accuracy: number | null = null;
                    let altitude_accuracy: number | null = null;

                    if (
                      `${columnName}_latlong_accuracy` in body &&
                      typeof body[`${columnName}_latlong_accuracy`] == "number"
                    ) {
                      latlong_accuracy = body[
                        `${columnName}_latlong_accuracy`
                      ] as number;
                    }

                    if (
                      `${columnName}_altitude_accuracy` in body &&
                      typeof body[`${columnName}_altitude_accuracy`] == "number"
                    ) {
                      latlong_accuracy = body[
                        `${columnName}_altitude_accuracy`
                      ] as number;
                    }

                    output[columnName] = new GeodeticCoordinate(
                      body[columnName] as string,
                      latlong_accuracy,
                      altitude_accuracy,
                    );
                    break;
                  default:
                    output[columnName] = parseDatabaseValue(
                      body[columnName],
                      columnSchema.datatype,
                    );
                    break;
                }

                if (columnSchema.record_on === "split") setIsSplit(true);
              }
            }

            setData(output);
            setIsCaching(false);
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

  useEffect(() => {
    // always keep controller data up to date
    for (const key in data) {
      controller.setValue(`data.${key}`, data[key], {
        shouldValidate: true,
        shouldTouch: false,
      });
    }

    // automatically update the cache when the user changes either the start or the end time.
    // only update when desired & valid
    if (cacheError || !isCaching) return;
    // update form values

    cache();
  }, [data]);

  // fetch tags
  useEffect(() => {
    // require no cache error & split
    if (!isSplit || cacheError) return;

    // only allow one concurrent fetch
    if (tagsLoading) return;
    setTagsLoading(true);

    // safe fetch dataset
    safeFetchDataset(
      `${CACHE_URL}/main/${toSnakeCase(databaseName)}/${toSnakeCase(tableInfo.tableName)}/tag_names`,
      TAG_NAMES_DATASET_SCHEMA,
    )
      .then((tagNames) => {
        setTagNames(tagNames);
        controller.resetField("data.primary_tag", {
          defaultValue: tagNames["data"][0][0],
        });
      })
      .catch((reason) => {
        toast(`Failed to load tags: ${reason}`);
        setTagNames(undefined);
      })
      .finally(() => {
        setTagsLoading(false);
      });
  }, [isSplit, cacheError, tagsRefreshState]);

  /**
   * Stores the startTime and endTime into the cache.
   */
  function cache() {
    // store values in cache
    // @TODO don't hardcode start_time & end_time
    getCSRFToken(CACHE_CSRF_ENDPOINT)
      .then((csrftoken: string) => {
        fetch(`${CACHE_URL}/cache/${databaseName}/${tableInfo.tableName}`, {
          method: "POST",
          body: JSON.stringify(data),
          mode: "cors",
          credentials: "include",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            "X-CSRFToken": csrftoken,
          },
        })
          .then((response) => {
            const newErrorState = !response.ok;
            if (newErrorState) {
              toast(
                `Something went wrong when trying to store the start or end time: ${response.status} ${response.statusText}`,
              );
            }

            setCacheError(newErrorState);
          })
          .catch((reason) => {
            toast(
              `Something went wrong when trying to store the start or end time: ${reason}`,
            );
            setCacheError(true);
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

    handleRecordOn({}, tableInfo, "start", toast)
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

    handleRecordOn(data, tableInfo, "split", toast)
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

    handleRecordOn(data, tableInfo, "split", toast, "purge")
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

  function onSubmit(
    values: z.infer<typeof schema>,
    event?: React.BaseSyntheticEvent,
  ): void {
    const submitter = (event?.nativeEvent as SubmitEvent)?.submitter;
    const action = submitter?.getAttribute("value");

    submitEntry(
      `${CACHE_URL}/main/${toSnakeCase(databaseName)}/${toSnakeCase(tableInfo.tableName)}`,
      values,
      CACHE_CSRF_ENDPOINT,
    )
      .then(() => {
        toast("Form submitted!");
        submissionCallback();
        switch (action) {
          case "split":
            start();
            break;
          default:
            cancel();
        }
      })
      .catch((reason) => {
        toast(`Form submission failed: ${reason}`);
        console.log(`Form submission failed: ${reason}`);
      });
  }

  function onSubmitInvalid(errors: FieldErrors<z.infer<typeof schema>>) {
    console.error("Invalid form submission.", errors);
    toast("Invalid form submission.");
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
    if (tagsLoading)
      return (
        <div className="flex flex-col items-center">
          <p>Loading tags...</p>
          <Button disabled={true}>
            <Spinner />
          </Button>
        </div>
      );

    if (tagNames === undefined)
      return (
        <div className="flex flex-col items-center">
          <p>Error while loading tags.</p>
          <Button
            onClick={() => {
              if (!tagsLoading) {
                setTagsRefreshState(tagsRefreshState + 1);
              }
            }}
          >
            <RefreshCcw />
          </Button>
        </div>
      );

    return (
      <form
        onSubmit={controller.handleSubmit(onSubmit, onSubmitInvalid)}
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
        <Columns fieldsToEnter={tableInfo.schema} form={controller} />
        {/* Quick actions */}
        {/* Tags */}
        {tableInfo.tagging && <Tags tagsDataset={tagNames} form={controller} />}
        {/* Descriptors */}
        {tableInfo.descriptors && (
          <Descriptors tableInfo={tableInfo} form={controller} />
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
      <p>{isStart ? data["start_time"].toLocaleString() : "No start time."}</p>
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
