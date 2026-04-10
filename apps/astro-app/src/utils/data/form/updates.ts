import type { TableInfo } from "@/types/data";
import {
  GeodeticCoordinate,
  GetCurrentGeodeticCoordinatePromise,
} from "@utils/datatypes/geodetic";

export function handleRecordOn(
  initialData: Record<string, any>,
  tableInfo: TableInfo,
  event_name: "start" | "split",
  printError: (msg: string) => unknown = (msg: string) => {},
  mode: "insert" | "purge" = "insert",
): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    let finalData = { ...initialData };
    let fetchTasks: Promise<any>[] = [];

    // update values that need to be recorded on start
    for (let columnSchema of tableInfo.schema) {
      if (columnSchema.record_on === event_name) {
        switch (mode) {
          case "purge":
            delete finalData[columnSchema.name];
            break;
          case "insert":
            switch (columnSchema.datatype) {
              case "timestamp":
                finalData[columnSchema.name] = new Date(Date.now());
                break;
              case "geodetic point":
                const currentTask = GetCurrentGeodeticCoordinatePromise(
                  navigator,
                  {
                    enableHighAccuracy: true,
                    timeout: 1000,
                  },
                )
                  .then((value: GeodeticCoordinate) => {
                    finalData[columnSchema.name] = value;
                  })
                  .catch((reason?: GeolocationPositionError) => {
                    finalData[columnSchema.name] = undefined;
                    if (reason)
                      printError(`Failed to fetch location: ${reason.message}`);
                  });
                fetchTasks.push(currentTask);
                break;
              default:
                throw `Column "${columnSchema.name}"'s datatype does not support record_on.`;
            }
            break;
        }
      }
    }

    let fetchTasksCompleted = Promise.allSettled(fetchTasks);
    fetchTasksCompleted.catch(() => {});
    fetchTasksCompleted.finally(() => {
      resolve(finalData);
    });
  });
}
