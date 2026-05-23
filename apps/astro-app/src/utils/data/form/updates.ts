import type { TableInfo, RecordOnEvent } from "@/types/data";
import {
  GeodeticCoordinate,
  GetCurrentGeodeticCoordinatePromise,
} from "@utils/datatypes/geodetic";
import { toSnakeCase } from "@utils/parse";

export async function handleRecordOn(
  initialData: Record<string, any>,
  tableInfo: TableInfo,
  event_name: RecordOnEvent,
  mode: "insert" | "purge" = "insert",
): Promise<Record<string, any>> {
  const finalData = { ...initialData };
  const fetchTasks: Promise<void>[] = [];

  for (const columnSchema of tableInfo.schema) {
    const columnName = toSnakeCase(columnSchema.name);

    if (columnSchema.record_on !== event_name) continue;

    if (mode === "purge") {
      delete finalData[columnName];
      continue;
    }

    switch (columnSchema.datatype) {
      case "timestamp":
        finalData[columnName] = new Date(Date.now());
        break;
      case "geodetic point":
        fetchTasks.push(
          GetCurrentGeodeticCoordinatePromise(navigator, {
            enableHighAccuracy: true,
            timeout: 1000,
          })
            .then((value: GeodeticCoordinate) => {
              finalData[columnName] = value;
            })
            .catch((reason?: GeolocationPositionError) => {
              finalData[columnName] = undefined;
              if (reason)
                console.warn(`Failed to fetch location: ${reason.message}`);
            }),
        );
        break;
      default:
        console.warn(
          `Column "${columnSchema.name}"'s datatype ${columnSchema.datatype} does not support record_on.`,
        );
    }
  }

  await Promise.allSettled(fetchTasks);
  return finalData;
}
