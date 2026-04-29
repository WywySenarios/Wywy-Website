"use client";

import type { DescriptorInfo, TableInfo } from "@/types/data";
import type { JSX } from "astro/jsx-runtime";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CloudDownload, RefreshCw } from "lucide-react";
import { CACHE_URL, DATABASE_URL } from "astro:env/client";
import { OriginPicker } from "@/components/data/origin-picker";
import { CACHE_CSRF_ENDPOINT, getCSRFToken } from "@utils/auth";
import { GenericEntryTable } from "./entry-table";
import { TaggingTable } from "./tagging-table";

export interface EntryTableProps {
  databaseName: string;
  tableName: string;
  endpoint: string;
  refreshTrigger: number;
}

/**
 * Renders an EntryTable to view and modify entries on specific tables.
 * @param schema The schema of the table.
 * @param databaseName The name of the target database
 * @param tableName The name of the parent table, or the target table if the table has no parent.
 * @param type The type of table to render. Is either undefined (generic) or a tagging table type.
 * @returns an EntryTable component.
 */
export function EntryTable({
  schema,
  databaseName,
  tableName,
  type,
}: {
  schema?: TableInfo | DescriptorInfo | undefined;
  databaseName: string;
  tableName: string;
  type?:
    | undefined
    | "tags"
    | "tag_names"
    | "tag_aliases"
    | "tag_groups"
    | "descriptors"
    | "data";
}): JSX.Element {
  const [origin, setOrigin] = useState<string>(CACHE_URL);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [pullTrigger, setPullTrigger] = useState<number>(0);
  let disablePullTrigger = true;

  let endpoint;
  switch (origin) {
    case DATABASE_URL:
      endpoint = `${DATABASE_URL}`;
      break;
    case CACHE_URL:
      endpoint = `${CACHE_URL}/main`;
      break;
    default:
      return <p>Something went wrong while picking the Origin to read from.</p>;
  }
  let table: JSX.Element = null;
  // params applicable to every type of entry table
  const genericEntryTableParams: EntryTableProps = {
    databaseName: databaseName,
    tableName: tableName,
    endpoint: endpoint,
    refreshTrigger: refreshTrigger,
  };

  useEffect(() => {
    // this only applies for the cache
    if (origin != CACHE_URL) return;

    // do not call when initially loading the webpage
    if (pullTrigger == 0) return;

    // only request refreshes on tags, tag_names, and tag_alaises tables.
    switch (type) {
      case "tags":
        break;
      case "tag_names":
        break;
      case "tag_aliases":
        break;
      default:
        toast(
          "You may only refresh these tables: tags, tag_names, tag_aliases.",
        );
        return;
    }

    // tell the cache to fetch data from the master database.
    getCSRFToken(CACHE_CSRF_ENDPOINT)
      .catch((reason: any) => {
        toast(`Failed to request cache data update: ${reason}`);
      })
      .then((csrftoken: string | void) => {
        if (!csrftoken) {
          toast(`Failed to request cache data update: Invalid CSRF token.`);
          return;
        }
        fetch(`${CACHE_URL}/refresh/${databaseName}/${tableName}/${type}`, {
          method: "POST",
          mode: "cors",
          credentials: "include",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            "X-CSRFToken": csrftoken,
          },
        })
          .catch((reason: any) => {
            toast(`Failed to request cache data update: ${reason}`);
          })
          .then((response: Response | void) => {
            if (!response) {
              toast(`Failed to request cache data update: No response.`);
              return;
            } else if (!response.ok) {
              response
                .text()
                .catch((reason: any) => {
                  toast(`Failed to request cache data update: ${reason}`);
                })
                .then((text: string | void) => {
                  if (!text) {
                    toast(
                      `Failed to request cache data update. No reason provided.`,
                    );
                  }

                  toast(`Failed to request cache data update: ${text}`);
                });
              return;
            }

            toast(`Successfully requested cache update.`);
          });
      });
  }, [pullTrigger]);

  switch (type) {
    case undefined:
    case "data":
    case "descriptors":
      if (schema == undefined) return <NoTable />;

      table = (
        <GenericEntryTable
          type={type ? type : "data"}
          schema={schema}
          {...genericEntryTableParams}
        />
      );
      break;
    case "tag_aliases":
    case "tag_names":
      disablePullTrigger = false;
    case "tags":
    case "tag_groups":
      table = <TaggingTable type={type} {...genericEntryTableParams} />;
      break;
  }

  return (
    <div>
      <div className="flex flex-row justify-center space-x-0.5">
        <Button
          onClick={() => {
            setPullTrigger(pullTrigger + 1);
          }}
          disabled={disablePullTrigger}
        >
          <CloudDownload />
        </Button>
        <OriginPicker origin={origin} setOrigin={setOrigin} />
        <Button
          onClick={() => {
            setRefreshTrigger(refreshTrigger + 1);
          }}
        >
          <RefreshCw />
        </Button>
      </div>
      {table}
    </div>
  );
}

/**
 * Component to be rendered when something is wrong. @TODO pretty up this component
 */
function NoTable(): JSX.Element {
  <p>Something went wrong.</p>;
}
