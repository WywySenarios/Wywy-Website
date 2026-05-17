import type { TableInfo } from "@/types/data";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Columns, Descriptors, Tags } from "@/components/data/data-entry";
import type z from "zod";
import { toast } from "sonner";
import { getCSRFToken } from "@utils/auth";
import { parseDatabaseValue } from "@utils/data/deserialization";
import type { JSONValue } from "@/types/http";
import { CACHE_URL } from "astro:env/client";
import { RefreshCcw, Upload } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { GeodeticCoordinate } from "@utils/datatypes/geodetic";
import { createFormController } from "@/utils/data/form/full-entry-handlers";
import { submitEntry, useDataset } from "@/utils/data/http";
import type { FieldErrors } from "react-hook-form";
import {
  TAG_NAMES_DATASET_SCHEMA,
  type TAG_NAMES_DATASET,
} from "@utils/data/schema";
import { toSnakeCase } from "@utils/parse";
import { useAutoPopulate } from "@utils/data/form/useAutoPopulate";

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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [tagsRefreshState, setTagsRefreshState] = useState<number>(0);
  const [isCaching, setIsCaching] = useState<boolean>(false);
  const [cacheError, setCacheError] = useState<boolean>(false);

  const { controller, schema } = createFormController(tableInfo);
  const { populate } = useAutoPopulate(tableInfo, controller);

  const startTime = controller.watch("data.start_time");
  const isStart: boolean = startTime != null;

  const [tagNamesDataset, tagsLoading, tagsError] = useDataset({
    valid: isSplit && !cacheError,
    table_type: "tag_names",
    schema: undefined,
    source: "cache",
    endpointOptions: {
      databaseName,
      tableName: tableInfo.tableName,
    },
    refreshState: tagsRefreshState,
  });
  // type assertion: fallback to undefined preserves the expected type while useDataset gates rendering behind loading/error checks
  const tagNames =
    tagNamesDataset ??
    (undefined as unknown as z.infer<typeof TAG_NAMES_DATASET_SCHEMA>);

  // GETs the cached start/end times from the cache server and injects them into the controller
  function fetchCache() {
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

            for (const [key, value] of Object.entries(output)) {
              controller.setValue(`data.${key}`, value, {
                shouldValidate: true,
              });
            }
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

  // @TODO tag suggestions — pick the most likely tag instead of the first one
  // automatically set primary_tag when tag names load
  useEffect(() => {
    if (tagNamesDataset) {
      controller.setValue("data.primary_tag", tagNamesDataset["data"][0][0]);
    }
  }, [tagNamesDataset]);

  /**
   * Stores the startTime and endTime into the cache.
   */
  async function cache(customData?: Record<string, any>) {
    try {
      const cacheData = customData ?? controller.getValues("data");
      const csrftoken = await getCSRFToken("cache");
      const response = await fetch(
        `${CACHE_URL}/cache/${databaseName}/${tableInfo.tableName}`,
        {
          method: "POST",
          body: JSON.stringify(cacheData),
          mode: "cors",
          credentials: "include",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            "X-CSRFToken": csrftoken,
          },
        },
      );
      const newErrorState = !response.ok;
      if (newErrorState) {
        toast(
          `Something went wrong when trying to store the start or end time: ${response.status} ${response.statusText}`,
        );
      }
      setCacheError(newErrorState);
    } catch (reason) {
      toast(
        `Something went wrong when trying to store the start or end time: ${reason}`,
      );
      setCacheError(true);
    } finally {
      setIsCaching(false);
    }
  }

  // Starts a new timing session: populates start-time columns and caches them
  async function start() {
    if (isCaching) return;
    setIsCaching(true);

    setIsSplit(false);

    try {
      await populate("start");
      await cache();
    } catch (reason) {
      if (reason) toast(`Failed to start: ${reason}`);
      setCacheError(true);
    }
  }

  // Ends the current timing segment: populates split-time columns and caches them
  async function split() {
    if (isCaching) return;
    setIsCaching(true);

    try {
      await populate("split");
      setIsSplit(true);
      await cache();
      if (tableInfo.tagging && tagNames) {
        controller.setValue("data.primary_tag", tagNames["data"][0][0]);
      }
    } catch (reason) {
      if (reason) toast(`Failed to split: ${reason}`);
      setCacheError(true);
    }
  }

  // Undoes the split: purges split-time columns from the controller and cache
  async function cancelSplit() {
    if (isCaching) return;
    setIsCaching(true);

    try {
      await populate("split", "purge");
      setIsSplit(false);
      await cache();
    } catch (reason) {
      if (reason) toast(`Failed to cancel split: ${reason}`);
      setCacheError(true);
    }
  }

  // Cancels the entire session: clears the cache and resets split state
  async function cancel() {
    if (isCaching) return;
    setIsCaching(true);

    setIsSplit(false);
    await cache({});
  }

  // Handles form entry submission, then restarts or cancels based on the clicked button's value
  function onSubmit(
    values: z.infer<typeof schema>,
    event?: React.BaseSyntheticEvent,
  ): void {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const submitter = (event?.nativeEvent as SubmitEvent)?.submitter;
    const action = submitter?.getAttribute("value");

    submitEntry(
      `${CACHE_URL}/main/${toSnakeCase(databaseName)}/${toSnakeCase(tableInfo.tableName)}`,
      values,
      "cache",
    )
      .then(() => {
        toast("Form submitted!");
        submissionCallback();
        controller.reset();
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
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  // Logs and notifies the user when form validation fails
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
          <Button onClick={() => cache()}>
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

    if (tagsError || tagNames === undefined)
      return (
        <div className="flex flex-col items-center">
          <p>Error while loading tags.</p>
          <Button
            onClick={() => {
              setTagsRefreshState(tagsRefreshState + 1);
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
        <Button type="submit" disabled={isSubmitting}>Submit</Button>
        {/* Columns */}
        <Columns fieldsToEnter={tableInfo.schema} form={controller} />
        {/* Quick actions */}
        {/* Tags */}
        {tableInfo.tagging && (
          // type assertion: useDataset validates against TAG_NAMES_DATASET_SCHEMA internally
          <Tags tagsDataset={tagNames as TAG_NAMES_DATASET} form={controller} />
        )}
        {/* Descriptors */}
        {tableInfo.descriptors && (
          <Descriptors tableInfo={tableInfo} form={controller} />
        )}
        {/* Submit & restart button */}
        <Button type="submit" disabled={isSubmitting} value="split">
          Submit & Restart
          {isSubmitting ? <Spinner /> : null}
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
      <p>{isStart ? startTime.toLocaleString() : "No start time."}</p>
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
