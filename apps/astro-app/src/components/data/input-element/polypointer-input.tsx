"use client";

import type { DataColumn } from "@/types/data";
import { useDatabaseName } from "@utils/data/schema-context";
import { useFormContext } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RemoteSearchSelect } from "./remote-search-select";

/**
 * Input element for polypointer columns: type dropdown + remote search select.
 * @param columnInfo - column schema info
 * @param fieldName - snake_cased name of the polypointer column
 * @param formFieldName - full RHF field path for the polypointer column ID (e.g. "descriptors.related_item[0].related_item"). When set, the _type subcolumn path is derived from this. Falls back to fieldName for root-level use.
 * @param value - current polypointer ID value
 * @param onChange - called when the ID changes
 */
export function PolypointerInput({
  columnInfo,
  fieldName,
  formFieldName,
  value,
  onChange,
}: {
  columnInfo: DataColumn;
  fieldName: string;
  formFieldName?: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  const formContext = useFormContext();
  const databaseName = useDatabaseName();
  const idFieldName = formFieldName ?? fieldName;
  const typeFieldName = formFieldName
    ? `${formFieldName}_type`
    : `${fieldName}_type`;
  const currentType = formContext.watch(typeFieldName) as string | undefined;

  const refs =
    (columnInfo as DataColumn & { references?: string[] }).references ?? [];
  const typeOptions = refs.map((tableName) => ({
    key: tableName,
    tableName,
    displayName: tableName,
  }));

  return (
    <div className="flex flex-col gap-2 items-center">
      <Select
        value={currentType ?? ""}
        onValueChange={(val) => {
          formContext.setValue(typeFieldName, val);
          formContext.setValue(idFieldName, undefined);
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select type..." />
        </SelectTrigger>
        <SelectContent>
          {typeOptions.map((opt) => (
            <SelectItem key={opt.key} value={opt.key}>
              {opt.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentType && refs.includes(currentType) && (
        <RemoteSearchSelect
          databaseName={databaseName}
          tableName={currentType}
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );
}
