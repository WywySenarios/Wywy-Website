"use client";

import type { Dataset } from "@/types/data";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TableCell, TableFooter, TableRow } from "@/components/ui/table";
import { TaggingTableEntry } from "./entry";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CACHE_URL } from "astro:env/client";
import { CACHE_CSRF_ENDPOINT } from "@utils/auth";
import {
  TAGGING_TABLE_TAG_ALIASES_SCHEMA,
  TAGGING_TABLE_TAG_GROUPS_SCHEMA,
  TAGGING_TABLE_TAG_NAMES_SCHEMA,
  TAGGING_TABLE_TAGS_SCHEMA,
} from "@utils/data/schema";
import { submitEntry } from "@utils/data/http";
import { z } from "zod";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toSnakeCase } from "@utils/parse";
import { DatasetTable, getData } from "./entry-table";
import type { EntryTableProps } from "./entry-table-page";

interface TaggingEntryTableProps extends EntryTableProps {
  type: "tags" | "tag_names" | "tag_aliases" | "tag_groups";
}

/**
 * TAGGING SUB-TABLES ONLY: Render an entry table full of data and a form at the bottom to insert new entries in.
 * @param databaseName The name of the database that contains the target table.
 * @param tableName The name of the parent table (or the target table if there is no parent).
 * @param endpoint The endpoint prefix to get data from. (i.e. DATABASE_URL or CACHE_URL/main)
 * @param refreshTrigger A controlled field to trigger a refresh through useEffect.
 * @param type The type of TaggingTable to render.
 * @returns
 */
export function TaggingTable({
  databaseName,
  tableName,
  endpoint,
  refreshTrigger,
  type,
}: TaggingEntryTableProps) {
  const [data, setData] = useState<Dataset>();
  const [loading, setLoading] = useState<boolean>(true);

  const schema = useMemo(() => {
    switch (type) {
      case "tag_aliases":
        return TAGGING_TABLE_TAG_ALIASES_SCHEMA;
      case "tag_groups":
        return TAGGING_TABLE_TAG_GROUPS_SCHEMA;
      case "tag_names":
        return TAGGING_TABLE_TAG_NAMES_SCHEMA;
      case "tags":
        return TAGGING_TABLE_TAGS_SCHEMA;
    }
  }, [type]);

  const controller = useForm({
    resolver: zodResolver(schema),
  });

  function onSubmit(values: z.infer<typeof schema>) {
    submitEntry(
      `${CACHE_URL}/main/${toSnakeCase(databaseName)}/${toSnakeCase(tableName)}/${type}`,
      values,
      CACHE_CSRF_ENDPOINT,
    )
      .then(() => {
        // @TODO redirect, popup, etc.
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

  const expectedLength = useMemo(() => {
    switch (type) {
      case "tag_aliases":
        return 2;
      case "tag_groups":
        return 3;
      case "tag_names":
        return 2;
      case "tags":
        return 3;
    }
  }, [type]);

  // load in data from
  useEffect(() => {
    getData(
      `${endpoint}/${databaseName}/${tableName}/${type}`,
      setLoading,
      setData,
      z.any(), // @TODO strict typing
    );
  }, [endpoint, refreshTrigger]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!data) return <p>No data</p>;

  if (data.columns.length != expectedLength) {
    return <p>Something went wrong!</p>;
  }

  const footer = (
    <TableFooter>
      <TableRow>
        {data.columns.map((columnName: string) => (
          <TableCell key={`entry-table-footer-${columnName}`}>
            <TaggingTableEntry controller={controller} name={columnName} />
          </TableCell>
        ))}
      </TableRow>
    </TableFooter>
  );

  return (
    <form onSubmit={controller.handleSubmit(onSubmit, onSubmitInvalid)}>
      <DatasetTable dataset={data} footer={footer}></DatasetTable>
      <Button className="w-full" type="submit">
        <Plus />
      </Button>
    </form>
  );
}
