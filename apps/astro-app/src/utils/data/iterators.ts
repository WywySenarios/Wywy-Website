import type {
  DataColumn,
  DescriptorInfo,
  ResolvedColumnSchema,
  TableInfo,
} from "@/types/data";

/**
 * Resolves a column and its sub columns.
 * @param column The column schema of the column to resolve.
 */
export function* resolveColumnSchema(
  column: DataColumn,
): Generator<ResolvedColumnSchema> {
  switch (column.datatype) {
    case "bool":
    case "boolean":
      yield {
        ...column,
        datatype: "bool",
        entrytype: "none",
      };
      break;
    case "date":
    case "time":
    case "timestamp":
    case "enum":
      yield {
        ...column,
        entrytype: "none",
      };
      break;
    case "float":
    case "number":
      yield {
        ...column,
        datatype: "number",
        entrytype: "none",
      };
      break;
    case "geodetic point":
      yield {
        ...column,
        entrytype: "none",
      };
      yield {
        ...column,
        name: column.name + "_latlong_accuracy",
        datatype: "number",
        entrytype: "none",
        defaultValue: undefined,
      };
      yield {
        ...column,
        name: column.name + "_altitude",
        datatype: "number",
        entrytype: "none",
        defaultValue: undefined,
      };
      yield {
        ...column,
        name: column.name + "_altitude_accuracy",
        datatype: "number",
        entrytype: "none",
        defaultValue: undefined,
      };
      break;
    case "int":
    case "integer":
      yield {
        ...column,
        datatype: "int",
        entrytype: "none",
      };
      break;
    case "str":
    case "string":
    case "text":
      yield { ...column, datatype: "str", entrytype: "none" };
      break;
  }

  if (column.comments) {
    yield {
      name: column.name + "_comments",
      entrytype: "none",
      datatype: "str",
    };
  }
}

/**
 * Resolves a columns schema.
 * @param columnsSchema
 */
export function* resolveColumnsSchema(
  columnsSchema: DataColumn[],
): Generator<ResolvedColumnSchema> {
  for (const columnSchema of columnsSchema) {
    yield* resolveColumnSchema(columnSchema);
  }
}

/**
 * Resolves an entry schema.
 * @param entrySchema
 */
export function* resolveEntrySchema(
  entrySchema: TableInfo | DescriptorInfo,
): Generator<ResolvedColumnSchema> {
  if ("tagging" in entrySchema && entrySchema.tagging) {
    yield {
      name: "primary_tag",
      entrytype: "none",
      datatype: "int",
    };
  }

  yield* resolveColumnsSchema(entrySchema.schema);
}
